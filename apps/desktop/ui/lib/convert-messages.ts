import type { ThreadMessageLike } from "@assistant-ui/react";
import type { ApprovalArgs, ChatMessage } from "./types";

type MutableContent = Array<{
	type: string;
	[key: string]: unknown;
}>;

export function convertToThreadMessages(msgs: ChatMessage[]): ThreadMessageLike[] {
	const result: ThreadMessageLike[] = [];

	let assemblingAssistant: {
		id: string;
		createdAt: Date;
		content: MutableContent;
		isRunning: boolean;
		requiresAction: boolean;
	} | null = null;

	function flushAssistant() {
		if (!assemblingAssistant) return;
		if (assemblingAssistant.content.length > 0) {
			result.push({
				role: "assistant",
				id: assemblingAssistant.id,
				createdAt: assemblingAssistant.createdAt,
				content: assemblingAssistant.content as ThreadMessageLike["content"],
				status: assemblingAssistant.requiresAction
					? { type: "requires-action", reason: "tool-calls" }
					: assemblingAssistant.isRunning
						? { type: "running" }
						: { type: "complete", reason: "stop" },
			} as ThreadMessageLike);
		}
		assemblingAssistant = null;
	}

	function ensureAssistant(id: string, date: Date) {
		if (!assemblingAssistant) {
			assemblingAssistant = {
				id,
				createdAt: date,
				content: [],
				isRunning: false,
				requiresAction: false,
			};
		}
	}

	for (const msg of msgs) {
		if (msg.kind === "user") {
			flushAssistant();
			result.push({
				role: "user",
				id: msg.id,
				createdAt: msg.timestamp,
				content: [{ type: "text", text: msg.text }],
			});
		} else if (msg.kind === "reasoning") {
			ensureAssistant(`reasoning-${msg.id}`, msg.timestamp);
			assemblingAssistant!.content.push({ type: "reasoning", text: msg.text });
		} else if (msg.kind === "assistant") {
			ensureAssistant(`asmsg-${msg.id}`, msg.timestamp);
			assemblingAssistant!.content.push({ type: "text", text: msg.text });
			if (msg.streaming) assemblingAssistant!.isRunning = true;
		} else if (msg.kind === "tool") {
			ensureAssistant(`toolmsg-${msg.id}`, msg.timestamp);
			assemblingAssistant!.content.push({
				type: "tool-call",
				toolCallId: msg.id,
				toolName: msg.name,
				args: msg.input as Record<string, unknown>,
				result: msg.output != null ? { output: msg.output } : undefined,
				isError: msg.status === "error",
			});
			if (msg.status === "running") assemblingAssistant!.isRunning = true;
		} else if (msg.kind === "approval") {
			ensureAssistant(`approvalmsg-${msg.id}`, msg.timestamp);
			const approvalMeta: ApprovalArgs = {
				__isApproval: true,
				__approvalId: msg.id,
				__resolved: msg.resolved,
				__approved: msg.approved ?? null,
			};
			assemblingAssistant!.content.push({
				type: "tool-call",
				toolCallId: msg.id,
				toolName: msg.toolName,
				args: { ...(msg.input as Record<string, unknown>), ...approvalMeta },
				result: msg.resolved ? (msg.approved ? "approved" : "denied") : undefined,
			});
			if (!msg.resolved) assemblingAssistant!.requiresAction = true;
		} else if (msg.kind === "error") {
			flushAssistant();
			result.push({
				role: "assistant",
				id: `errmsg-${msg.id}`,
				createdAt: msg.timestamp,
				content: [{ type: "text", text: `⚠ ${msg.message}` }],
				status: { type: "incomplete", reason: "error" },
			} as ThreadMessageLike);
		}
	}

	flushAssistant();
	return result;
}
