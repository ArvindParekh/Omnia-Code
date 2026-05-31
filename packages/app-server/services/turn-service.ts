import type { CommandEnvelopeFor, MessageAttachment, ProviderRuntimeEvent } from "@omnia/contracts";
import type { SessionService } from "./session-service";
import type { ProviderAdapter, ProviderRegistry, ProviderSessionRef } from "@omnia/providers";
import { createEvent } from "../event-store";
import type { EventStore } from "../event-store";

export class TurnService {

  private activeAbortControllers = new Map<string, AbortController>();

  constructor(private readonly sessionService: SessionService, private readonly registry: ProviderRegistry, private readonly eventStore: EventStore){}

  async start(envelope: CommandEnvelopeFor<"turn.startRequested">): Promise<void> {
    const { sessionId, text, attachments } = envelope.payload;
    const turnId = envelope.id;
    const providerRef = this.sessionService.getProviderRef(sessionId);
    const adapter = this.registry.get(providerRef.provider);

    const abort = new AbortController();
    this.activeAbortControllers.set(turnId, abort);

    // running stream asynchronously. not awaiting here to avoid blocking, turn.start returns immediately and renderer gets events pushed as they arrive
    this.runStream({ adapter, providerRef, sessionId, turnId, text, attachments: attachments ?? [], signal: abort.signal });
  }

  async cancel(envelope: CommandEnvelopeFor<"turn.cancelRequested">): Promise<void> {
    const { turnId } = envelope.payload;

    const abort = this.activeAbortControllers.get(turnId);
    if (abort) {
      abort.abort();
      this.activeAbortControllers.delete(turnId);
    }
  }

  private async runStream(opts: { adapter: ProviderAdapter; providerRef: ProviderSessionRef; sessionId: string; turnId: string; text: string; attachments: MessageAttachment[]; signal: AbortSignal }): Promise<void> {
    try {
    const { adapter, providerRef, sessionId, turnId, text, attachments, signal } = opts;
      const messageId = crypto.randomUUID();

      const stream = adapter.sendTurn({
        sessionId: opts.sessionId,
        turnId: opts.turnId,
        text,
        attachments,
        providerSessionRef: providerRef,
        policy: {
          capabilities: [], //todo
        },
        signal,
        workspacePath: "", //todo
      })

      for await (const runtimeEvent of stream) {
        if (signal.aborted) break;
        this.mapAndAppend(runtimeEvent, { sessionId, turnId, messageId });
      }

      if (!signal.aborted) {
        this.eventStore.addEvent(createEvent("turn.completed", {
          sessionId,
          turnId,
          completedAt: Date.now(),
        }));
      }
    } catch (error) {
      const correlationId = crypto.randomUUID().slice(0, 8);
      console.error(`[turn:${opts.turnId}]`, error, correlationId);

      this.eventStore.addEvent(createEvent("turn.failed", {
        sessionId: opts.sessionId,
        turnId: opts.turnId,
        message: `Turn failed. Ref: ${correlationId}`,
        retryable: isTransientError(error), //todo
        correlationId,
      }));
    } finally {
      this.activeAbortControllers.delete(opts.turnId);
    }
  }

  private mapAndAppend(
    event: ProviderRuntimeEvent,
    ctx: { sessionId: string; turnId: string; messageId: string }
  ) {
    const { sessionId, turnId, messageId } = ctx;

    switch (event.type) {
          case "assistant.delta":
            this.eventStore.addEvent(createEvent("message.assistantDeltaReceived", {
              sessionId, turnId, messageId, text: event.text,
            }));
            break;
          case "assistant.completed":
            this.eventStore.addEvent(createEvent("message.assistantCompleted", {
              sessionId, turnId, messageId,
            }));
            break;
          case "tool.started":
            this.eventStore.addEvent(createEvent("tool.callStarted", {
              sessionId, turnId,
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              input: event.input,
              risk: event.risk,
            }));
            break;
          case "tool.completed":
            this.eventStore.addEvent(createEvent("tool.callCompleted", {
              sessionId, turnId,
              toolCallId: event.toolCallId,
              output: event.output,
              isError: event.isError,
            }));
            break;
          case "approval.requested":
            this.eventStore.addEvent(createEvent("approval.requested", {
              approvalId: event.approvalId,
              sessionId, turnId,
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              input: event.input,
              risk: event.risk,
            }));
            break;
          case "runtime.failed":
            this.eventStore.addEvent(createEvent("turn.failed", {
              sessionId, turnId,
              message: event.message,
              retryable: event.retryable,
              correlationId: event.providerCorrelationId,
            }));
            break;
        }
  }
}
