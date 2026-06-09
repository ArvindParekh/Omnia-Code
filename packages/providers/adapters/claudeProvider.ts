import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Provider, ProviderAvailability, ProviderRuntimeEvent } from "@omnia/contracts";
import type {
	CancelProviderTurnInput,
	CreateProviderSessionInput,
	DisposeProviderSessionInput,
	ProviderAdapter,
	ProviderSessionRef,
	ResolveProviderApprovalInput,
	ResumeProviderSessionInput,
	SendProviderTurnInput,
} from "../types.js";

export class ClaudeProvider implements ProviderAdapter {
	readonly provider: Provider = "claude";

	private activeTurns = new Map<
		string,
		{
			sessionId: string;
			stream: ReturnType<typeof query>;
			abortController: AbortController;
		}
	>();

	async detect(): Promise<ProviderAvailability> {
		try {
			const credPaths = [
				path.join(os.homedir(), ".claude", ".credentials.json"),
				path.join(os.homedir(), ".config", "Claude", ".credentials.json"),
			];
			const authenticated = credPaths.some(fs.existsSync);
			const version = execSync("claude --version", {
				encoding: "utf8",
				timeout: 3000,
			})
				.trim()
				.split(" ")[0];

			return {
				provider: this.provider,
				status: authenticated ? "available" : "needs_auth",
				label: "Claude",
				detectedVersion: version,
			};
		} catch (error) {
			return {
				provider: this.provider,
				status: "error",
				label: "Claude",
				detail: error instanceof Error ? error.message : String(error),
			};
		}
	}

	async createSession(input: CreateProviderSessionInput): Promise<ProviderSessionRef> {
		return {
			sessionId: input.sessionId,
			provider: this.provider,
			externalId: input.sessionId,
		};
	}

	async resumeSession(_input: ResumeProviderSessionInput): Promise<void> {}

	async disposeSession(input: DisposeProviderSessionInput): Promise<void> {
		const turnIds = [...this.activeTurns.entries()]
			.filter(([, active]) => active.sessionId === input.sessionId)
			.map(([turnId]) => turnId);

		await Promise.all(turnIds.map((turnId) => this.stopTurn(turnId)));
	}

	async *sendTurn(input: SendProviderTurnInput): AsyncIterable<ProviderRuntimeEvent> {
		const externalId = input.providerSessionRef.externalId;

		if (!externalId) {
			throw new Error("Claude session ID is missing");
		}

		if (!input.text.trim()) {
			throw new Error("Turn text is required");
		}

		if (input.attachments.length > 0) {
			throw new Error("Claude attachments are not implemented");
		}

		if (input.signal.aborted) return;

		const abortController = new AbortController();
		const forwardAbort = () => abortController.abort();
		input.signal.addEventListener("abort", forwardAbort, { once: true });

		const stream = query({
			prompt: input.text,
			options: {
				abortController,
				cwd: input.workspacePath,
				env: {
					...process.env,
					ANTHROPIC_API_KEY: undefined,
					CLAUDECODE: undefined,
				},
				includePartialMessages: true,
				permissionMode: "default",
				...(input.resume ? { resume: externalId } : { sessionId: externalId }),
			},
		});

		this.activeTurns.set(input.turnId, {
			sessionId: input.sessionId,
			stream,
			abortController,
		});

		let receivedDeltas = false;

		try {
			for await (const message of stream) {
				if (
					message.type === "stream_event" &&
					message.event.type === "content_block_delta" &&
					message.event.delta.type === "text_delta"
				) {
					receivedDeltas = true;
					yield {
						type: "assistant.delta",
						text: message.event.delta.text,
					};
				}

				if (message.type !== "result") continue;

				if (message.subtype !== "success") {
					yield {
						type: "runtime.failed",
						message: message.errors.join(" "),
						retryable: false,
						providerCorrelationId: message.uuid,
					};
					return;
				}

				if (!receivedDeltas && message.result) {
					yield {
						type: "assistant.delta",
						text: message.result,
					};
				}

				yield { type: "assistant.completed" };
				return;
			}
		} catch (error) {
			if (input.signal.aborted || abortController.signal.aborted) return;

			const correlationId = crypto.randomUUID().slice(0, 8);
			console.error("[CLAUDE]", error, correlationId);

			yield {
				type: "runtime.failed",
				message: `Claude failed. Ref: ${correlationId}`,
				retryable: isTransientError(error),
				providerCorrelationId: correlationId,
			};
		} finally {
			input.signal.removeEventListener("abort", forwardAbort);
			if (this.activeTurns.get(input.turnId)?.stream === stream) {
				this.activeTurns.delete(input.turnId);
			}
		}
	}

	async cancelTurn(input: CancelProviderTurnInput): Promise<void> {
		await this.stopTurn(input.turnId);
	}

	async resolveApproval(_input: ResolveProviderApprovalInput): Promise<void> {
		throw new Error("Claude approvals are not implemented");
	}

	private async stopTurn(turnId: string): Promise<void> {
		const active = this.activeTurns.get(turnId);
		if (!active) return;

		try {
			await active.stream.interrupt();
		} catch {
			// Cancellation is best-effort; aborting the SDK controller is the fallback.
		} finally {
			active.abortController.abort();
			this.activeTurns.delete(turnId);
		}
	}
}

function isTransientError(error: unknown): boolean {
	const message =
		error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
	return (
		message.includes("rate limit") ||
		message.includes("timeout") ||
		message.includes("econnreset") ||
		message.includes("503")
	);
}
