import { FileText, MagnifyingGlass } from "@phosphor-icons/react";
import { ToolCard, type ToolStatus } from "./tool-card";

export function CompactTool({
	toolName,
	headline,
	output,
	status,
}: {
	toolName: string;
	headline: string;
	output: string;
	status: ToolStatus;
}) {
	const lineCount = output ? output.split("\n").filter(Boolean).length : 0;

	return (
		<ToolCard
			status={status}
			icon={
				toolName === "Read" ? (
					<FileText size={11} weight="light" className="text-white/28 shrink-0" />
				) : (
					<MagnifyingGlass size={11} weight="light" className="text-white/28 shrink-0" />
				)
			}
			title={
				<span className="font-mono">
					<span className="text-white/28">{toolName.toLowerCase()} </span>
					<span className="text-white/55">{headline}</span>
				</span>
			}
			meta={
				lineCount > 0 ? (
					<span className="font-mono text-[11px] tabular-nums text-white/25">
						{lineCount} {lineCount === 1 ? "line" : "lines"}
					</span>
				) : undefined
			}
		>
			{output.length > 0 ? (
				<code className="block px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed text-white/38 whitespace-pre-wrap break-all select-text max-h-[320px] overflow-y-auto">
					{output}
				</code>
			) : undefined}
		</ToolCard>
	);
}
