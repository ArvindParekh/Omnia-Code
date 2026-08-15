import type {
	CommandEnvelopeFor,
	EventStore,
	MessageAttachment,
	ProviderRuntimeEvent,
	QuoteRef,
} from "@omnia/contracts";
import type { CancelProviderTurnInput, ProviderAdapter, ProviderRegistry } from "@omnia/providers";
import type { ProviderSessionRef, SessionPolicy } from "@omnia/contracts";
import { createEvent } from "../create-event.js";
import type { SessionService } from "./session-service.js";

type ActiveTurn = {
	abortController: AbortController;
	adapter: ProviderAdapter;
	cancelInput: CancelProviderTurnInput;
};

export class TurnService {
	private activeTurns = new Map<string, ActiveTurn>();

	constructor(
		private readonly sessionService: SessionService,
		private readonly registry: ProviderRegistry,
		private readonly eventStore: EventStore,
	) {}

	async start(envelope: CommandEnvelopeFor<"turn.startRequested">): Promise<void> {
		const { sessionId, text, attachments, quote } = envelope.payload;
		const turnId = envelope.payload.turnId;
		const {
			ref: providerRef,
			workspacePath,
			policy,
		} = this.sessionService.getProviderSession(sessionId);
		const adapter = this.registry.get(providerRef.provider);
		// Scoped to the session so this is an indexed range scan, not a full log read.
		const resume = this.eventStore
			.getEvents(sessionId)
			.some((event) => event.type === "turn.started" && event.payload.turnId !== turnId);

		const abortController = new AbortController();
		this.activeTurns.set(turnId, {
			abortController,
			adapter,
			cancelInput: {
				sessionId,
				providerSessionRef: providerRef,
				turnId,
				workspacePath,
				policy,
				signal: abortController.signal,
			},
		});

		// Run asynchronously so the command returns while provider events continue streaming.
		void this.runStream({
			adapter,
			providerRef,
			sessionId,
			turnId,
			text,
			attachments: attachments ?? [],
			quote,
			workspacePath,
			policy,
			resume,
			signal: abortController.signal,
		});
	}

	async cancel(envelope: CommandEnvelopeFor<"turn.cancelRequested">): Promise<void> {
		const active = this.activeTurns.get(envelope.payload.turnId);
		if (!active) return;

		active.abortController.abort();
		try {
			await active.adapter.cancelTurn(active.cancelInput);
		} finally {
			this.activeTurns.delete(envelope.payload.turnId);
		}
	}

	private async runStream(opts: {
		adapter: ProviderAdapter;
		providerRef: ProviderSessionRef;
		sessionId: string;
		turnId: string;
		text: string;
		attachments: MessageAttachment[];
		quote?: QuoteRef;
		workspacePath: string;
		policy: SessionPolicy;
		resume: boolean;
		signal: AbortSignal;
	}): Promise<void> {
		try {
			const {
				adapter,
				providerRef,
				sessionId,
				turnId,
				text,
				attachments,
				quote,
				workspacePath,
				policy,
				resume,
				signal,
			} = opts;
			const messageId = crypto.randomUUID();
			let failed = false;

			const stream = adapter.sendTurn({
				sessionId,
				turnId,
				text,
				attachments,
				quote,
				providerSessionRef: providerRef,
				workspacePath,
				policy,
				resume,
				signal,
			});

			for await (const runtimeEvent of stream) {
				if (signal.aborted) break;
				if (runtimeEvent.type === "runtime.failed") failed = true;
				this.mapAndAppend(runtimeEvent, { sessionId, turnId, messageId });
			}

			if (!signal.aborted && !failed) {
				this.eventStore.addEvent(
					createEvent("turn.completed", {
						sessionId,
						turnId,
						completedAt: Date.now(),
					}),
				);
			}
		} catch (error) {
			if (opts.signal.aborted) return;

			const correlationId = crypto.randomUUID().slice(0, 8);
			console.error(`[turn:${opts.turnId}]`, error, correlationId);

			this.eventStore.addEvent(
				createEvent("turn.failed", {
					sessionId: opts.sessionId,
					turnId: opts.turnId,
					message: `Turn failed. Ref: ${correlationId}`,
					retryable: true,
					correlationId,
				}),
			);
		} finally {
			this.activeTurns.delete(opts.turnId);
		}
	}

	private mapAndAppend(
		event: ProviderRuntimeEvent,
		ctx: { sessionId: string; turnId: string; messageId: string },
	) {
		const { sessionId, turnId, messageId } = ctx;

		switch (event.type) {
			case "assistant.delta":
				this.eventStore.addEvent(
					createEvent("message.assistantDeltaReceived", {
						sessionId,
						turnId,
						messageId,
						text: event.text,
					}),
				);
				break;
			case "assistant.completed":
				this.eventStore.addEvent(
					createEvent("message.assistantCompleted", {
						sessionId,
						turnId,
						messageId,
					}),
				);
				break;
			case "reasoning.delta":
				this.eventStore.addEvent(
					createEvent("message.reasoningDeltaReceived", {
						sessionId,
						turnId,
						messageId,
						text: event.text,
					}),
				);
				break;
			case "tool.started":
				this.eventStore.addEvent(
					createEvent("tool.callStarted", {
						sessionId,
						turnId,
						toolCallId: event.toolCallId,
						toolName: event.toolName,
						input: event.input,
						risk: event.risk,
					}),
				);
				break;
			case "tool.completed":
				this.eventStore.addEvent(
					createEvent("tool.callCompleted", {
						sessionId,
						turnId,
						toolCallId: event.toolCallId,
						output: event.output,
						isError: event.isError,
					}),
				);
				break;
			case "approval.requested":
				this.eventStore.addEvent(
					createEvent("approval.requested", {
						approvalId: event.approvalId,
						sessionId,
						turnId,
						toolCallId: event.toolCallId,
						toolName: event.toolName,
						input: event.input,
						risk: event.risk,
					}),
				);
				break;
			case "runtime.failed":
				this.eventStore.addEvent(
					createEvent("turn.failed", {
						sessionId,
						turnId,
						message: event.message,
						retryable: event.retryable,
						correlationId: event.providerCorrelationId,
					}),
				);
				break;
		}
	}
}
