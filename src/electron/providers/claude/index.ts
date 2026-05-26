import { AIProvider } from "../base.js";
import os from "os";
import type { AgentEvent, Provider, Session } from "../../../shared/types.js";
import { query, startup } from "@anthropic-ai/claude-agent-sdk";
import path from "path";
import { existsSync } from "fs";

export class ClaudeProvider implements AIProvider {
  readonly name = "Claude";

  private warmInstance: Awaited<ReturnType<typeof startup>> | null = null;
  private sessions: Map<string, Session & { cancel: () => void }> = new Map();
  private pendingApprovals: Map<string, (d: boolean) => void> = new Map();

  async createSession(provider: Provider) {
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    try {
      this.warmInstance = await startup({
        options: {
          maxTurns: 1,
          env: {
            ...process.env,
            ANTHROPIC_API_KEY: undefined,
          },
        },
      });

      this.sessions.set(sessionId, {
        id: sessionId,
        provider,
        title: "Claude",
        status: "idle" as const,
        createdAt: now,
        updatedAt: now,
        cancel: () => {},
      });

      return {
        id: sessionId,
        provider,
        title: "Claude",
        status: "idle" as const,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("[CLAUDE] prewarm failed: ", error);
      return {
        id: sessionId,
        provider,
        title: "Claude (Error)",
        status: "error" as const,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  async *sendMessage(
    sessionId: string,
    message: string,
  ): AsyncGenerator<AgentEvent> {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    if (!this.warmInstance) {
      throw new Error("Warm instance is not available");
    }

    if (!message || message.trim().length === 0) {
      throw new Error("Message is required");
    }

    const env = {
      ...process.env,
      ANTHROPIC_API_KEY: undefined,
      CLAUDECODE: undefined,
    };

    const sdkOptions = {
      maxTurns: 5,
      systemPrompt: "",
      permissionMode: "default" as const,
      includePartialMessages: true,
      cwd: os.homedir(),
      env,
      model: "claude-haiku-4-5",
    };

    const abort = new AbortController();
    this.sessions.set(sessionId, {
      ...this.sessions.get(sessionId)!,
      cancel: () => abort.abort(),
    });

    let receivedDeltas = false;
    try {
      const stream = this.warmInstance
        ? this.warmInstance.query(message)
        : query({ prompt: message, options: sdkOptions });
      for await (const chunk of stream) {
        if (abort.signal.aborted) break;

        if (
          chunk.type === "stream_event" &&
          chunk.event.type === "content_block_delta" &&
          chunk.event.delta.type === "text_delta"
        ) {
          receivedDeltas = true;
          yield { type: "delta", text: chunk.event.delta.text };
        }

        if (
          chunk.type === "stream_event" &&
          chunk.event.type === "content_block_delta" &&
          chunk.event.delta.type === "text_delta"
        ) {
          receivedDeltas = true;
          yield { type: "delta", text: chunk.event.delta.text };
        }

        if (chunk.type === "result") {
          if (chunk.subtype !== "success") {
            yield {
              type: "error",
              message: chunk.errors.join(" "),
              retryable: false,
              correlationId: chunk.uuid,
            };
          } else {
            if (!receivedDeltas && chunk.result) {
              yield { type: "delta", text: chunk.result };
            }
            yield { type: "done" };
          }
        }
      }
    } catch (error) {
      const correlationId = crypto.randomUUID().slice(0, 8);
      console.error("[CLAUDE]", error, correlationId);

      const retryable = isTransientError(error);
      yield {
        type: "error",
        message: `AI failed. Ref: ${correlationId}`,
        retryable,
        correlationId,
      };
    }
  }

  getSessions(): Session[] {
    const sessions: Session[] = [];
    for (const value of this.sessions.values()) {
      sessions.push(value);
    }
    return sessions;
  }

  confirm(sessionId: string, toolCallId: string, approved: boolean): void {
    this.pendingApprovals.get(toolCallId)?.(approved);
    this.pendingApprovals.delete(toolCallId);
  }

  getEvents(sessionId: string): AgentEvent[] {
    console.log(sessionId);
    return [];
  }

  static isAvailable(): boolean {
    const creds = path.join(os.homedir(), ".claude", ".credentials.json");
    return existsSync(creds);
  }
}

function isTransientError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message.toLowerCase()
      : String(err).toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("503")
  );
}
