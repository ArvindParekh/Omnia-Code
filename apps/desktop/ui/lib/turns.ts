import type { InspectorEvent, SessionViewItem, TurnGroup } from "./types";

function toInspectorEvent(item: SessionViewItem): InspectorEvent {
	switch (item.kind) {
		case "user":
			return {
				id: item.id,
				type: "user",
				summary: "message.userCreated",
				detail: item.text.slice(0, 80),
			};
		case "assistant":
			return {
				id: item.id,
				type: "delta",
				summary: "message.assistantDelta",
				detail: item.text.slice(0, 80),
				status: item.streaming ? "running" : "done",
			};
		case "reasoning":
			return {
				id: item.id,
				type: "reasoning",
				summary: "message.reasoningDelta",
				detail: item.text.slice(0, 80),
				status: item.streaming ? "running" : "done",
			};
		case "tool":
			return {
				id: item.id,
				type: "tool",
				summary: `tool.callStarted — ${item.name}`,
				status: item.status,
				toolName: item.name,
				input: item.input as Record<string, unknown>,
				output: item.output,
			};
		case "approval":
			return {
				id: item.id,
				type: "approval",
				summary: `approval.requested — ${item.toolName}`,
				status: item.resolved ? (item.approved ? "done" : "error") : "pending",
				toolName: item.toolName,
				input: item.input as Record<string, unknown>,
			};
		case "error":
			return {
				id: item.id,
				type: "error",
				summary: "turn.failed",
				detail: item.message,
				status: "error",
			};
	}
}

function statusOf(items: SessionViewItem[]): TurnGroup["status"] {
	if (items.some((item) => item.kind === "error")) return "failed";

	const pending = items.some(
		(item) =>
			((item.kind === "assistant" || item.kind === "reasoning") && item.streaming) ||
			(item.kind === "tool" && item.status === "running") ||
			(item.kind === "approval" && !item.resolved),
	);
	return pending ? "running" : "done";
}

export function groupIntoTurns(items: SessionViewItem[]): TurnGroup[] {
	const order: string[] = [];
	const byTurn = new Map<string, SessionViewItem[]>();

	for (const item of items) {
		const existing = byTurn.get(item.turnId);
		if (existing) {
			existing.push(item);
		} else {
			byTurn.set(item.turnId, [item]);
			order.push(item.turnId);
		}
	}

	return order.map((turnId, index) => {
		const turnItems = byTurn.get(turnId) ?? [];
		return {
			id: turnId,
			index: index + 1,
			status: statusOf(turnItems),
			events: turnItems.map(toInspectorEvent),
		};
	});
}
