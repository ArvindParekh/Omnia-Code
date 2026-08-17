import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
	deleteSession,
	getSessionInfo,
	query,
	renameSession,
	type CanUseTool,
	type PermissionResult,
} from "@anthropic-ai/claude-agent-sdk";
import { ToolRisk } from "@omnia/contracts";
import type { Provider, ProviderAvailability, ProviderRuntimeEvent } from "@omnia/contracts";
import type {
	CancelProviderTurnInput,
	CreateProviderSessionInput,
	DeleteProviderSessionInput,
	DisposeProviderSessionInput,
	ProviderAdapter,
	RenameProviderSessionInput,
	ResolveProviderApprovalInput,
	ResumeProviderSessionInput,
	SendProviderTurnInput,
} from "../types.js";
import type { ProviderSessionRef } from "@omnia/contracts";

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

	private lastTitle = new Map<string, string>(); // sessionId -> title
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

	async resumeSession(_input: ResumeProviderSessionInput): Promise<void> {}

	async disposeSession(input: DisposeProviderSessionInput): Promise<void> {
		this.lastTitle.delete(input.sessionId);

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

		if (input.signal.aborted) return;

		const abortController = new AbortController();
		const forwardAbort = () => abortController.abort();
		input.signal.addEventListener("abort", forwardAbort, { once: true });

		const events = new AsyncEventQueue<ProviderRuntimeEvent>();

		const stream = query({
			prompt: buildPrompt(input),
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
				thinking: { type: "adaptive" },
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

			const suggested = await this.suggestTitle(input.sessionId, externalId, input.workspacePath);
			if (suggested) yield { type: "session.titleSuggested", title: suggested };
		} finally {
			input.signal.removeEventListener("abort", forwardAbort);
		}
	}

	private async suggestTitle(
		sessionId: string,
		externalId: string,
		workspacePath: string,
	): Promise<string | null> {
		try {
			const info = await getSessionInfo(externalId, { dir: workspacePath });
			if (!info?.summary || info.summary === this.lastTitle.get(sessionId)) return null;

			this.lastTitle.set(sessionId, info.summary);
			return info.summary;
		} catch {
			return null;
		}
	}

	async renameSession(input: RenameProviderSessionInput): Promise<void> {
		const { sessionId, providerSessionRef, customTitle } = input;
		this.lastTitle.set(sessionId, customTitle);
		await renameSession(providerSessionRef.externalId ?? sessionId, customTitle);
	}

	async deleteSession(input: DeleteProviderSessionInput): Promise<void> {
		const { sessionId, providerSessionRef } = input;
		this.lastTitle.delete(sessionId);
		await deleteSession(providerSessionRef.externalId ?? sessionId);
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
				? {
						behavior: "allow",
						updatedInput: (input.input ?? {}) as Record<string, unknown>,
						toolUseID: input.toolCallId,
					}
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

		// Block indices restart at 0 for every assistant message in a turn, so an
		// index is only unique between its start and stop. Minting an id per block
		// is what keeps text emitted after a tool call from merging back into the
		// message that preceded it.
		const blocks = new Map<number, { id: string; kind: string }>();

		const blockIdFor = (index: number, kind: string): string => {
			const existing = blocks.get(index);
			if (existing) return existing.id;

			const created = { id: crypto.randomUUID(), kind };
			blocks.set(index, created);
			return created.id;
		};

		const closeOpenTextBlocks = () => {
			for (const [index, block] of blocks) {
				if (block.kind === "text") {
					events.push({ type: "assistant.completed", blockId: block.id });
				}
				blocks.delete(index);
			}
		};

		try {
			for await (const message of stream) {
				if (message.type === "stream_event" && message.event.type === "content_block_start") {
					blocks.set(message.event.index, {
						id: crypto.randomUUID(),
						kind: message.event.content_block.type,
					});
				}

				if (message.type === "stream_event" && message.event.type === "content_block_stop") {
					const block = blocks.get(message.event.index);
					if (block) {
						if (block.kind === "text") {
							events.push({ type: "assistant.completed", blockId: block.id });
						}
						blocks.delete(message.event.index);
					}
				}

				if (
					message.type === "stream_event" &&
					message.event.type === "content_block_delta" &&
					message.event.delta.type === "text_delta"
				) {
					receivedDeltas = true;
					events.push({
						type: "assistant.delta",
						blockId: blockIdFor(message.event.index, "text"),
						text: message.event.delta.text,
					});
				}

				if (
					message.type === "stream_event" &&
					message.event.type === "content_block_delta" &&
					message.event.delta.type === "thinking_delta"
				) {
					events.push({
						type: "reasoning.delta",
						blockId: blockIdFor(message.event.index, "thinking"),
						text: message.event.delta.thinking,
					});
				}

				if (message.type === "assistant") {
					for (const block of message.message.content) {
						if (block.type !== "tool_use") continue;
						events.push({
							type: "tool.started",
							toolCallId: block.id,
							toolName: block.name,
							input: block.input,
							risk: classifyToolRisk(block.name),
						});
					}
				}

				if (message.type === "user") {
					if (Array.isArray(message.message.content)) {
						for (const block of message.message.content) {
							if (block.type !== "tool_result") continue;
							events.push({
								type: "tool.completed",
								toolCallId: block.tool_use_id,
								output: block.content,
								isError: block.is_error ?? false,
							});
						}
					}
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
					const blockId = crypto.randomUUID();
					events.push({ type: "assistant.delta", blockId, text: message.result });
					events.push({ type: "assistant.completed", blockId });
					return;
				}

				closeOpenTextBlocks();
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

function buildPrompt(input: SendProviderTurnInput): string {
	const sections = [input.text];

	if (input.quote) {
		sections.unshift(`Quoting a previous message:\n\n> ${input.quote.text.replace(/\n/g, "\n> ")}`);
	}

	if (input.attachments.length > 0) {
		const files = input.attachments.map((a) => `- ${a.path}`).join("\n");
		sections.push(`Attached files (read these as needed):\n${files}`);
	}

	return sections.join("\n\n");
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
