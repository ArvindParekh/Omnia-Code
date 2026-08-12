import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { query, type CanUseTool, type PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import { ToolRisk } from "@omnia/contracts";
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

const HIGH_RISK_TOOLS = new Set(["Bash", "Write", "Edit", "NotebookEdit", "KillShell"]);

function classifyToolRisk(toolName: string): ToolRisk {
	return HIGH_RISK_TOOLS.has(toolName) ? ToolRisk.HIGH : ToolRisk.MEDIUM;
}

// Bridges `canUseTool` (invoked by the SDK out-of-band, whenever it wants) with
// `sendTurn`'s `for await` loop (which only advances when asked) into one stream.
class AsyncEventQueue<T> {
	private readonly buffered: T[] = [];
	private readonly waiting: ((result: IteratorResult<T>) => void)[] = [];
	private closed = false;

	push(value: T): void {
		const waiter = this.waiting.shift();
		if (waiter) waiter({ value, done: false });
		else this.buffered.push(value);
	}

	close(): void {
		this.closed = true;
		for (const waiter of this.waiting.splice(0)) {
			waiter({ value: undefined as T, done: true });
		}
	}

	async *[Symbol.asyncIterator](): AsyncIterator<T> {
		while (true) {
			if (this.buffered.length > 0) {
				yield this.buffered.shift() as T;
				continue;
			}
			if (this.closed) return;
			const result = await new Promise<IteratorResult<T>>((resolve) => {
				this.waiting.push(resolve);
			});
			if (result.done) return;
			yield result.value;
		}
	}
}

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

	private activeApprovals = new Map<
		string,
		{ turnId: string; resolve: (result: PermissionResult) => void }
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

	async resumeSession(_input: ResumeProviderSessionInput): Promise<void> { }

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

		const events = new AsyncEventQueue<ProviderRuntimeEvent>();

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
				canUseTool: this.createCanUseTool(input.turnId, events),
				...(input.resume ? { resume: externalId } : { sessionId: externalId }),
			},
		});

		this.activeTurns.set(input.turnId, {
			sessionId: input.sessionId,
			stream,
			abortController,
		});

		void this.forwardStream(stream, events, input.turnId, abortController, input.signal);

		try {
			for await (const event of events) {
				yield event;
			}
		} finally {
			input.signal.removeEventListener("abort", forwardAbort);
		}
	}

	async cancelTurn(input: CancelProviderTurnInput): Promise<void> {
		await this.stopTurn(input.turnId);
	}

	async resolveApproval(input: ResolveProviderApprovalInput): Promise<void> {
		const pending = this.activeApprovals.get(input.toolCallId);
		if (!pending) return;

		this.activeApprovals.delete(input.toolCallId);
		pending.resolve(
			input.approved
				? { behavior: "allow", toolUseID: input.toolCallId }
				: {
					behavior: "deny",
					message: input.note ? String(input.note) : "User denied",
					toolUseID: input.toolCallId,
				},
		);
	}

	private createCanUseTool(
		turnId: string,
		events: AsyncEventQueue<ProviderRuntimeEvent>,
	): CanUseTool {
		return (toolName, toolInput, options) => {
			const { promise, resolve } = createDeferred<PermissionResult>();
			this.activeApprovals.set(options.toolUseID, { turnId, resolve });
			events.push({
				type: "approval.requested",
				approvalId: crypto.randomUUID(),
				toolCallId: options.toolUseID,
				toolName,
				input: toolInput,
				risk: classifyToolRisk(toolName),
			});
			return promise;
		};
	}

	private async forwardStream(
		stream: ReturnType<typeof query>,
		events: AsyncEventQueue<ProviderRuntimeEvent>,
		turnId: string,
		abortController: AbortController,
		signal: AbortSignal,
	): Promise<void> {
		let receivedDeltas = false;

		try {
			for await (const message of stream) {
				if (
					message.type === "stream_event" &&
					message.event.type === "content_block_delta" &&
					message.event.delta.type === "text_delta"
				) {
					receivedDeltas = true;
					events.push({
						type: "assistant.delta",
						text: message.event.delta.text,
					});
				}

				if (message.type !== "result") continue;

				if (message.subtype !== "success") {
					events.push({
						type: "runtime.failed",
						message: message.errors.join(" "),
						retryable: false,
						providerCorrelationId: message.uuid,
					});
					return;
				}

				if (!receivedDeltas && message.result) {
					events.push({
						type: "assistant.delta",
						text: message.result,
					});
				}

				events.push({ type: "assistant.completed" });
				return;
			}
		} catch (error) {
			if (signal.aborted || abortController.signal.aborted) return;

			const correlationId = crypto.randomUUID().slice(0, 8);
			console.error("[CLAUDE]", error, correlationId);

			events.push({
				type: "runtime.failed",
				message: `Claude failed. Ref: ${correlationId}`,
				retryable: isTransientError(error),
				providerCorrelationId: correlationId,
			});
		} finally {
			events.close();
			if (this.activeTurns.get(turnId)?.stream === stream) {
				this.activeTurns.delete(turnId);
			}
		}
	}

	private async stopTurn(turnId: string): Promise<void> {
		const active = this.activeTurns.get(turnId);
		if (!active) return;

		for (const [toolCallId, pending] of this.activeApprovals) {
			if (pending.turnId !== turnId) continue;
			pending.resolve({ behavior: "deny", message: "Turn canceled", toolUseID: toolCallId });
			this.activeApprovals.delete(toolCallId);
		}

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

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}
