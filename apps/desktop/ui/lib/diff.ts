import { structuredPatch } from "diff";

export type DiffLine = {
	kind: "add" | "remove" | "context";
	oldNumber: number | null;
	newNumber: number | null;
	text: string;
};

export type DiffHunk = {
	key: string;
	lines: DiffLine[];
};

export type FileDiff = {
	hunks: DiffHunk[];
	added: number;
	removed: number;
};

export function computeDiff(before: string, after: string, context = 3): FileDiff {
	const patch = structuredPatch("before", "after", before, after, "", "", { context });

	let added = 0;
	let removed = 0;

	const hunks = patch.hunks.map((hunk) => {
		let oldNumber = hunk.oldStart;
		let newNumber = hunk.newStart;
		const lines: DiffLine[] = [];

		for (const raw of hunk.lines) {
			if (raw.startsWith("\\")) continue;

			const text = raw.slice(1);
			if (raw.startsWith("+")) {
				added++;
				lines.push({ kind: "add", oldNumber: null, newNumber: newNumber++, text });
			} else if (raw.startsWith("-")) {
				removed++;
				lines.push({ kind: "remove", oldNumber: oldNumber++, newNumber: null, text });
			} else {
				lines.push({ kind: "context", oldNumber: oldNumber++, newNumber: newNumber++, text });
			}
		}

		return { key: `${hunk.oldStart}:${hunk.newStart}`, lines };
	});

	return { hunks, added, removed };
}
