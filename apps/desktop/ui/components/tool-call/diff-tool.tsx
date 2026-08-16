import { FilePlus, PencilSimple } from "@phosphor-icons/react";
import type { ThemedToken } from "shiki";
import { useMemo } from "react";
import { useCodeTokens } from "../../hooks/use-code-tokens";
import { computeDiff, type DiffLine } from "../../lib/diff";
import { type FileEdit, languageFromPath, splitPath } from "../../lib/tools";
import { cn } from "../../lib/utils";
import { ToolCard, type ToolStatus } from "./tool-card";

const LINE_TINT: Record<DiffLine["kind"], string> = {
	add: "bg-[var(--diff-add-bg)]",
	remove: "bg-[var(--diff-remove-bg)]",
	context: "",
};

const SIGN: Record<DiffLine["kind"], string> = {
	add: "+",
	remove: "-",
	context: " ",
};

function DiffRow({ line, tokens }: { line: DiffLine; tokens: ThemedToken[] | undefined }) {
	return (
		<div className={cn("flex leading-[1.55]", LINE_TINT[line.kind])}>
			<span className="shrink-0 w-9 pr-2 text-right tabular-nums text-white/18 select-none">
				{line.oldNumber ?? ""}
			</span>
			<span className="shrink-0 w-9 pr-2 text-right tabular-nums text-white/18 select-none">
				{line.newNumber ?? ""}
			</span>
			<span
				className={cn(
					"shrink-0 w-4 text-center select-none",
					line.kind === "add" && "text-[var(--diff-add)]",
					line.kind === "remove" && "text-[var(--diff-remove)]",
					line.kind === "context" && "text-white/15",
				)}
			>
				{SIGN[line.kind]}
			</span>
			<code className="whitespace-pre-wrap break-all select-text pr-3">
				{tokens
					? tokens.map((token) => (
							<span key={token.offset} style={{ color: token.color }}>
								{token.content}
							</span>
						))
					: line.text}
				{line.text === "" && " "}
			</code>
		</div>
	);
}

export function DiffTool({
	edit,
	status,
	isCreate,
}: {
	edit: FileEdit;
	status: ToolStatus;
	isCreate: boolean;
}) {
	const diff = useMemo(() => computeDiff(edit.before, edit.after), [edit.before, edit.after]);
	const language = useMemo(() => languageFromPath(edit.filePath), [edit.filePath]);
	const { directory, name } = useMemo(() => splitPath(edit.filePath), [edit.filePath]);

	const beforeTokens = useCodeTokens(edit.before, language);
	const afterTokens = useCodeTokens(edit.after, language);

	const tokensFor = (line: DiffLine): ThemedToken[] | undefined => {
		if (line.kind === "remove") return beforeTokens?.[(line.oldNumber ?? 1) - 1];
		return afterTokens?.[(line.newNumber ?? 1) - 1];
	};

	return (
		<ToolCard
			defaultOpen
			status={status}
			icon={
				isCreate ? (
					<FilePlus size={11} weight="light" className="text-white/28 shrink-0" />
				) : (
					<PencilSimple size={11} weight="light" className="text-white/28 shrink-0" />
				)
			}
			title={
				<span className="font-mono">
					<span className="text-white/28">{directory}</span>
					<span className="text-white/60">{name}</span>
				</span>
			}
			meta={
				<span className="font-mono text-[11px] tabular-nums">
					{diff.added > 0 && <span className="text-[var(--diff-add)]">+{diff.added}</span>}
					{diff.added > 0 && diff.removed > 0 && <span className="text-white/20"> </span>}
					{diff.removed > 0 && <span className="text-[var(--diff-remove)]">−{diff.removed}</span>}
				</span>
			}
		>
			<div className="font-mono text-[11.5px] overflow-x-auto py-1.5 max-h-[420px] overflow-y-auto">
				{diff.hunks.map((hunk, hunkIndex) => (
					<div key={hunk.key}>
						{hunkIndex > 0 && <div className="my-1.5 border-t border-dashed border-white/[7%]" />}
						{hunk.lines.map((line) => (
							<DiffRow
								key={`${line.kind}:${line.oldNumber}:${line.newNumber}`}
								line={line}
								tokens={tokensFor(line)}
							/>
						))}
					</div>
				))}
			</div>
		</ToolCard>
	);
}
