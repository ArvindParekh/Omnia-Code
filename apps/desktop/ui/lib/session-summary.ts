import { ToolRisk } from "@omnia/contracts";
import { computeDiff } from "./diff";
import { parseFileEdit, parseShellCommand, splitPath } from "./tools";
import type { SessionViewItem } from "./types";

export type FileChange = {
	path: string;
	name: string;
	directory: string;
	edits: number;
	added: number;
	removed: number;
	created: boolean;
};

export type CommandRun = {
	id: string;
	command: string;
	status: "running" | "done" | "error";
	risk: ToolRisk;
};

export type SessionSummary = {
	durationMs: number;
	turns: number;
	toolCalls: number;
	highRiskCalls: number;
	files: FileChange[];
	commands: CommandRun[];
	approvals: { approved: number; denied: number; pending: number };
	errors: { id: string; message: string }[];
};

export function computeSessionSummary(items: SessionViewItem[]): SessionSummary {
	const files = new Map<string, FileChange>();
	const commands: CommandRun[] = [];
	const errors: { id: string; message: string }[] = [];
	const turnIds = new Set<string>();
	const approvals = { approved: 0, denied: 0, pending: 0 };

	let toolCalls = 0;
	let highRiskCalls = 0;
	let firstAt = Number.POSITIVE_INFINITY;
	let lastAt = 0;

	for (const item of items) {
		turnIds.add(item.turnId);
		firstAt = Math.min(firstAt, item.createdAt);
		lastAt = Math.max(lastAt, item.createdAt);

		if (item.kind === "error") {
			errors.push({ id: item.id, message: item.message });
			continue;
		}

		if (item.kind === "approval") {
			if (!item.resolved) approvals.pending++;
			else if (item.approved) approvals.approved++;
			else approvals.denied++;
			continue;
		}

		if (item.kind !== "tool") continue;

		toolCalls++;
		if (item.risk === ToolRisk.HIGH) highRiskCalls++;

		const input = (item.input ?? {}) as Record<string, unknown>;

		const edit = parseFileEdit(item.name, input);
		if (edit) {
			const diff = computeDiff(edit.before, edit.after);
			const existing = files.get(edit.filePath);

			if (existing) {
				existing.edits++;
				existing.added += diff.added;
				existing.removed += diff.removed;
			} else {
				const { directory, name } = splitPath(edit.filePath);
				files.set(edit.filePath, {
					path: edit.filePath,
					name,
					directory,
					edits: 1,
					added: diff.added,
					removed: diff.removed,
					created: item.name === "Write",
				});
			}
			continue;
		}

		if (item.name === "Bash") {
			const shell = parseShellCommand(input);
			if (shell) {
				commands.push({
					id: item.id,
					command: shell.command,
					status: item.status,
					risk: item.risk,
				});
			}
		}
	}

	return {
		durationMs: lastAt > 0 ? lastAt - firstAt : 0,
		turns: turnIds.size,
		toolCalls,
		highRiskCalls,
		files: [...files.values()],
		commands,
		approvals,
		errors,
	};
}
