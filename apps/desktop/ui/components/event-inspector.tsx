import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import type { MockSession, TurnGroup, InspectorEvent } from "../lib/types";
import { providerLabel } from "../lib/provider";
import { cn } from "../lib/utils";

type EventInspectorProps = {
	session: MockSession;
	turns: TurnGroup[];
};

export function EventInspector({ session, turns }: EventInspectorProps) {
	const label = providerLabel(session.provider);
	const totalEvents = turns.reduce((n, t) => n + t.events.length, 0);

	return (
		<div className="flex flex-col w-[256px] shrink-0 overflow-hidden bg-background">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-white/[6%] shrink-0">
				<span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
					Inspector
				</span>
				<span className="text-[10px] font-mono text-white/18">{label}</span>
			</div>

			{/* Turn list */}
			<div className="flex-1 overflow-y-auto py-1">
				{turns.length === 0 ? (
					<div className="flex items-center justify-center py-10">
						<p className="text-[11px] text-white/20">No events</p>
					</div>
				) : (
					turns.map((turn) => <TurnSection key={turn.id} turn={turn} />)
				)}
			</div>

			{/* Footer */}
			<div className="border-t border-white/[5%] px-4 py-2 shrink-0">
				<span className="text-[10px] font-mono text-white/18">
					{turns.length}t · {totalEvents}e
				</span>
			</div>
		</div>
	);
}

function TurnSection({ turn }: { turn: TurnGroup }) {
	const [collapsed, setCollapsed] = useState(false);

	const statusColors: Record<TurnGroup["status"], string> = {
		done: "text-white/30",
		running: "text-white/45 status-running",
		failed: "text-red-400/50",
		canceled: "text-white/20",
	};

	const statusGlyph: Record<TurnGroup["status"], string> = {
		done: "✓",
		running: "…",
		failed: "✗",
		canceled: "–",
	};

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
				<span className="text-[11px] font-medium text-white/40">Turn {turn.index}</span>
				<span className={cn("text-[10px] font-mono ml-1", statusColors[turn.status])}>
					{statusGlyph[turn.status]}
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

function EventRow({ event, isLast }: { event: InspectorEvent; isLast: boolean }) {
	const [expanded, setExpanded] = useState(false);
	const opacity = getEventOpacity(event.type, event.status);

	return (
		<div>
			<button
				onClick={() => event.detail && setExpanded((v) => !v)}
				className={cn(
					"w-full flex items-center gap-2 pl-8 pr-4 py-[3px] transition-colors text-left",
					event.detail ? "hover:bg-white/[3%] cursor-pointer" : "cursor-default",
				)}
			>
				{/* Tree line */}
				<span className="shrink-0 w-3 flex flex-col items-center relative" aria-hidden="true">
					{!isLast && (
						<span className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-white/[5%]" />
					)}
					<span className="w-[5px] h-[5px] rounded-full bg-white/[12%] relative z-10 mt-[5px]" />
				</span>

				<span
					className="text-[11px] font-mono truncate flex-1 min-w-0 text-foreground"
					style={{ opacity }}
				>
					{event.summary}
				</span>

				{event.detail && (
					<CaretRight
						size={8}
						weight="bold"
						className={cn("text-white/18 transition-transform shrink-0", expanded && "rotate-90")}
					/>
				)}
			</button>

			{expanded && event.detail && (
				<div className="pl-14 pr-4 py-1.5">
					<code className="block text-[10px] font-mono text-white/22 leading-relaxed whitespace-pre-wrap break-all select-text">
						{event.detail}
					</code>
				</div>
			)}
		</div>
	);
}

function getEventOpacity(type: string, status?: InspectorEvent["status"]): number {
	if (type === "error" || status === "error") return 0.45;
	if (type === "approval" || status === "pending") return 0.5;
	if (status === "running") return 0.45;
	if (type === "turn.end") return 0.32;
	if (type === "user") return 0.5;
	return 0.3;
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}
