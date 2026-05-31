import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import type { MockSession, TurnGroup, InspectorEvent } from "../App";
import { providerLabel } from "../lib/provider";

type EventInspectorProps = {
	session: MockSession;
	turns: TurnGroup[];
};

export function EventInspector({ session, turns }: EventInspectorProps) {
	const label = providerLabel(session.provider);
	const totalEvents = turns.reduce((n, t) => n + t.events.length, 0);

	return (
		<div className="flex flex-col w-[260px] shrink-0 overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-white/[6%] shrink-0">
				<span className="text-[10px] font-medium uppercase tracking-[0.09em] text-white/22">
					Events
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
			<div className="border-t border-white/[6%] px-4 py-2 shrink-0 flex items-center gap-3">
				<span className="text-[10px] font-mono text-white/18">
					{turns.length}t &middot; {totalEvents}e
				</span>
			</div>
		</div>
	);
}

function TurnSection({ turn }: { turn: TurnGroup }) {
	const [collapsed, setCollapsed] = useState(false);

	const statusGlyph =
		turn.status === "done"
			? "✓"
			: turn.status === "running"
				? "…"
				: turn.status === "failed"
					? "✗"
					: "–";

	return (
		<div>
			{/* Turn header */}
			<button
				onClick={() => setCollapsed((v) => !v)}
				className="w-full flex items-center gap-1.5 px-4 py-1.5 hover:bg-white/[3%] transition-colors"
			>
				<CaretRight
					size={9}
					className={`text-white/22 transition-transform shrink-0 ${collapsed ? "" : "rotate-90"}`}
				/>
				<span className="text-[11px] font-medium text-white/40">Turn {turn.index}</span>
				<span className="text-[10px] font-mono text-white/22 ml-1">{statusGlyph}</span>
				{turn.durationMs != null && (
					<span className="text-[10px] font-mono text-white/18 ml-auto">
						{formatDuration(turn.durationMs)}
					</span>
				)}
			</button>

			{/* Events */}
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
	const dim = getEventOpacity(event.type, event.status);

	return (
		<div>
			<button
				onClick={() => event.detail && setExpanded((v) => !v)}
				className={`w-full flex items-center gap-2 pl-8 pr-4 py-[3px]
					transition-colors text-left
					${event.detail ? "hover:bg-white/[3%] cursor-pointer" : "cursor-default"}`}
			>
				{/* Tree line */}
				<span className="shrink-0 w-3 flex flex-col items-center relative" aria-hidden="true">
					<span
						className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-white/[6%]"
						style={{ display: isLast ? "none" : undefined }}
					/>
					<span className="w-1 h-1 rounded-full bg-white/[14%] relative z-10 mt-[5px]" />
				</span>

				<span
					className="text-[11px] font-mono truncate flex-1 min-w-0"
					style={{ color: `rgba(255,255,255,${dim})` }}
				>
					{event.summary}
				</span>

				{event.detail && (
					<CaretRight
						size={8}
						className={`text-white/18 transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`}
					/>
				)}
			</button>

			{expanded && event.detail && (
				<div className="pl-14 pr-4 py-1.5">
					<code className="block text-[10px] font-mono text-white/22 leading-relaxed whitespace-pre-wrap break-all selectable">
						{event.detail}
					</code>
				</div>
			)}
		</div>
	);
}

function getEventOpacity(type: string, status?: InspectorEvent["status"]): number {
	if (type === "error" || status === "error") return 0.4;
	if (type === "approval" || status === "pending") return 0.5;
	if (status === "running") return 0.45;
	if (type === "turn.end") return 0.38;
	if (type === "user") return 0.5;
	return 0.32;
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}
