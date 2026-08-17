import type { ThreadMessageLike } from "@assistant-ui/react";
import type { ApprovalArgs, MessageAttachment, SessionViewItem } from "./types";

type MutableContent = Array<{
	type: string;
	[key: string]: unknown;
}>;

function toUiAttachment(attachment: MessageAttachment) {
	return {
		id: attachment.id,
		type: attachment.kind === "image" ? ("image" as const) : ("file" as const),
		name: attachment.name,
		contentType: attachment.contentType ?? "application/octet-stream",
		status: { type: "complete" as const },
		content: [],
	};
}

export function convertToThreadMessages(msgs: SessionViewItem[]): ThreadMessageLike[] {
	const result: ThreadMessageLike[] = [];

	let assemblingAssistant: {
		id: string;
		createdAt: Date;
		content: MutableContent;
		isRunning: boolean;
		requiresAction: boolean;
		completedAt: number;
	} | null = null;

	function flushAssistant() {
		if (!assemblingAssistant) return;
		if (assemblingAssistant.content.length > 0) {
			result.push({
				role: "assistant",
				id: assemblingAssistant.id,
				createdAt: assemblingAssistant.createdAt,
				content: assemblingAssistant.content as unknown as ThreadMessageLike["content"],
				metadata: { custom: { completedAt: assemblingAssistant.completedAt } },
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
				completedAt: date.getTime(),
			};
		}
		assemblingAssistant.completedAt = Math.max(assemblingAssistant.completedAt, date.getTime());
	}

	for (const msg of msgs) {
		if (msg.kind === "user") {
			flushAssistant();
			result.push({
				role: "user",
				id: msg.id,
				createdAt: new Date(msg.createdAt),
				content: [{ type: "text", text: msg.text }],
				// MessagePrimitive.Quote reads metadata.custom.quote to render the
				// quoted snippet on the message bubble. Only set it when present.
				...(msg.quote ? { metadata: { custom: { quote: msg.quote } } } : {}),
				// MessagePrimitive.Attachments reads message.attachments to render
				// attachment chips on the sent message bubble.
				...(msg.attachments.length ? { attachments: msg.attachments.map(toUiAttachment) } : {}),
			});
		} else if (msg.kind === "reasoning") {
			ensureAssistant(`reasoning-${msg.id}`, new Date(msg.createdAt));
			assemblingAssistant!.content.push({ type: "reasoning", text: msg.text });
			if (msg.streaming) assemblingAssistant!.isRunning = true;
		} else if (msg.kind === "assistant") {
			ensureAssistant(`asmsg-${msg.id}`, new Date(msg.createdAt));
			assemblingAssistant!.content.push({ type: "text", text: msg.text });
			if (msg.streaming) assemblingAssistant!.isRunning = true;
		} else if (msg.kind === "tool") {
			ensureAssistant(`toolmsg-${msg.id}`, new Date(msg.createdAt));
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
			ensureAssistant(`approvalmsg-${msg.id}`, new Date(msg.createdAt));
			const approvalMeta: ApprovalArgs = {
				__isApproval: true,
				__approvalId: msg.id,
				__resolved: msg.resolved,
				__approved: msg.approved ?? null,
				__note: msg.note,
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
				createdAt: new Date(msg.createdAt),
				content: [{ type: "text", text: `⚠ ${msg.message}` }],
				status: { type: "incomplete", reason: "error" },
			} as ThreadMessageLike);
		}
	}

	flushAssistant();
	return result;
}
