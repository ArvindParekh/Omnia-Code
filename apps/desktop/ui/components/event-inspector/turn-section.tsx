import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import type { TurnGroup } from "../../lib/types";
import { cn } from "../../lib/utils";
import { EventRow } from "./event-row";

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

const STATUS_COLORS: Record<TurnGroup["status"], string> = {
	done: "text-white/30",
	running: "text-white/45 status-running",
	failed: "text-red-400/50",
	canceled: "text-white/20",
};

const STATUS_GLYPH: Record<TurnGroup["status"], string> = {
	done: "✓",
	running: "…",
	failed: "✗",
	canceled: "–",
};

export function TurnSection({ turn }: { turn: TurnGroup }) {
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div>
			<button
				onClick={() => setCollapsed((v) => !v)}
				className="w-full flex items-center gap-1.5 px-4 py-1.5 hover:bg-white/[3%] transition-colors"
			>
				<CaretRight
					size={9}
					weight="bold"
					className={cn("text-white/22 transition-transform shrink-0", !collapsed && "rotate-90")}
				/>
				<span className="text-[10px] font-mono tabular-nums text-white/20 shrink-0">
					{turn.index}
				</span>
				<span className="text-[11px] font-medium text-white/45 truncate min-w-0" title={turn.title}>
					{turn.title}
				</span>
				<span className={cn("text-[10px] font-mono shrink-0", STATUS_COLORS[turn.status])}>
					{STATUS_GLYPH[turn.status]}
				</span>
				{turn.durationMs != null && (
					<span className="text-[10px] font-mono text-white/18 ml-auto">
						{formatDuration(turn.durationMs)}
					</span>
				)}
			</button>

			{!collapsed && (
				<div className="pb-0.5">
					{turn.events.map((event, i) => (
						<EventRow key={event.id} event={event} isLast={i === turn.events.length - 1} />
					))}
				</div>
			)}
		</div>
	);
}
