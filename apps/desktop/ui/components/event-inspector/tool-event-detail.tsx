import { SpinnerGap, Terminal, Warning } from "@phosphor-icons/react";
import type { InspectorEvent } from "../../lib/types";
import { getToolPrimaryArg } from "../../lib/tool-call";

// Sidebar-scale counterpart to ToolCallBlock (the main-chat tool card) —
// same header/body grammar, shrunk to the inspector's proportions.
export function ToolEventDetail({ event }: { event: InspectorEvent }) {
	const primaryArg = getToolPrimaryArg(event.input ?? {});
	const output = event.output != null ? String(event.output) : undefined;

	return (
		<div className="rounded-lg border border-white/[8%] bg-white/[2%] overflow-hidden">
			<div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-white/[5%]">
				<div className="flex items-center gap-1.5 min-w-0">
					<Terminal size={10} weight="light" className="text-white/28 shrink-0" />
					<span className="font-mono text-[9px] text-white/40 truncate">{event.toolName}</span>
				</div>
				{event.status === "running" ? (
					<SpinnerGap size={9} weight="bold" className="text-white/25 animate-spin shrink-0" />
				) : (
					event.status === "error" && (
						<Warning size={9} weight="fill" className="text-[var(--warn)] shrink-0" />
					)
				)}
			</div>
			<div className="px-2.5 py-2 space-y-1.5">
				<code className="block font-mono text-[9px] text-white/48 leading-relaxed whitespace-pre-wrap break-all select-text">
					{primaryArg}
				</code>
				{output && (
					<code className="block font-mono text-[9px] text-white/24 leading-relaxed whitespace-pre-wrap break-all select-text">
						{output}
					</code>
				)}
			</div>
		</div>
	);
}
