import { describeLookup, parseFileEdit, parseShellCommand, splitPath } from "./tools";
import type { InspectorEvent, SessionViewItem, TurnGroup } from "./types";

function firstLine(text: string, max = 68): string {
	const line =
		text
			.split("\n")
			.find((candidate) => candidate.trim().length > 0)
			?.trim() ?? "";
	return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

function describeTool(toolName: string, input: Record<string, unknown>): string {
	const edit = parseFileEdit(toolName, input);
	if (edit) {
		const verb = toolName === "Write" ? "Created" : "Edited";
		return `${verb} ${splitPath(edit.filePath).name}`;
	}

	if (toolName === "Bash") {
		const shell = parseShellCommand(input);
		if (shell) return `Ran ${firstLine(shell.command, 54)}`;
	}

	const lookup = describeLookup(toolName, input);
	if (lookup) {
		if (toolName === "Read") return `Read ${splitPath(lookup).name}`;
		if (toolName === "Grep") return `Searched ${lookup}`;
		return `Matched ${lookup}`;
	}

	return toolName;
}

function toInspectorEvent(item: SessionViewItem): InspectorEvent {
	switch (item.kind) {
		case "user":
			return {
				id: item.id,
				type: "user",
				summary: firstLine(item.text) || "Sent a message",
				detail: item.text,
			};
		case "assistant":
			return {
				id: item.id,
				type: "assistant",
				summary: firstLine(item.text) || "Responded",
				detail: item.text,
				status: item.streaming ? "running" : "done",
			};
		case "reasoning":
			return {
				id: item.id,
				type: "reasoning",
				summary: `Thought — ${firstLine(item.text, 54)}`,
				detail: item.text,
				status: item.streaming ? "running" : "done",
			};
		case "tool": {
			const input = (item.input ?? {}) as Record<string, unknown>;
			return {
				id: item.id,
				type: "tool",
				summary: describeTool(item.name, input),
				status: item.status,
				toolName: item.name,
				input,
				output: item.output,
			};
		}
		case "approval": {
			const input = (item.input ?? {}) as Record<string, unknown>;
			const what = describeTool(item.toolName, input);
			const verb = item.resolved ? (item.approved ? "Approved" : "Denied") : "Needs approval";
			return {
				id: item.id,
				type: "approval",
				summary: `${verb} — ${what}`,
				status: item.resolved ? (item.approved ? "done" : "error") : "pending",
				toolName: item.toolName,
				input,
			};
		}
		case "error":
			return {
				id: item.id,
				type: "error",
				summary: `Failed — ${firstLine(item.message, 54)}`,
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
		const prompt = turnItems.find((item) => item.kind === "user");
		const timestamps = turnItems.map((item) => item.createdAt);

		return {
			id: turnId,
			index: index + 1,
			title: prompt ? firstLine(prompt.text, 44) : `Turn ${index + 1}`,
			status: statusOf(turnItems),
			durationMs:
				timestamps.length > 1 ? Math.max(...timestamps) - Math.min(...timestamps) : undefined,
			events: turnItems.map(toInspectorEvent),
		};
	});
}
