import type { TurnCost } from "@omnia/contracts";
import { CaretRight } from "@phosphor-icons/react";
import { useState } from "react";
import { formatCost, formatTokens } from "../../lib/format";
import type { TurnGroup } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
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

function CostBreakdown({ cost }: { cost: TurnCost }) {
	const rows: Array<[string, number]> = [
		["Input", cost.usage.input_tokens],
		["Output", cost.usage.output_tokens],
		["Cache read", cost.usage.cache_read_input_tokens],
		["Cache write", cost.usage.cache_creation_input_tokens],
	];
	const tokens =
		cost.usage.input_tokens +
		cost.usage.output_tokens +
		cost.usage.cache_read_input_tokens +
		cost.usage.cache_creation_input_tokens;

	return (
		<div className="flex w-36 flex-col gap-1.5 px-3 py-2 text-background">
			<div className="flex items-baseline justify-between gap-6">
				<span className="text-[11px] font-semibold tabular-nums">
					{formatCost(cost.totalCostUsd)}
				</span>
				<span className="text-[9px] tabular-nums opacity-55">{formatTokens(tokens)} tok</span>
			</div>
			<div className="h-px bg-background/15" />
			<div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
				{rows.map(([label, value]) => (
					<div key={label} className="contents">
						<span className="text-[9px] opacity-55">{label}</span>
						<span className="text-right text-[9px] tabular-nums">{formatTokens(value)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function TurnSection({ turn, cost }: { turn: TurnGroup; cost?: TurnCost }) {
	const [collapsed, setCollapsed] = useState(false);
	const hasCost = cost != null && cost.totalCostUsd > 0;

	const header = (
		<button
			type="button"
			onClick={() => setCollapsed((v) => !v)}
			className="w-full flex items-center gap-1.5 px-4 py-1.5 hover:bg-white/[3%] transition-colors"
		>
			<CaretRight
				size={9}
				weight="bold"
				className={cn("text-white/22 transition-transform shrink-0", !collapsed && "rotate-90")}
			/>
			<span className="text-[9px] font-mono tabular-nums text-white/20 shrink-0">{turn.index}</span>
			<span className="text-[10px] font-medium text-white/45 truncate min-w-0" title={turn.title}>
				{turn.title}
			</span>
			<span className={cn("text-[9px] font-mono shrink-0", STATUS_COLORS[turn.status])}>
				{STATUS_GLYPH[turn.status]}
			</span>
			<div className="ml-auto flex items-center gap-2 shrink-0">
				{hasCost && (
					<span className="font-mono text-[9px] tabular-nums text-white/35">
						{formatCost(cost.totalCostUsd)}
					</span>
				)}
				{turn.durationMs != null && (
					<span className="font-mono text-[9px] text-white/18">
						{formatDuration(turn.durationMs)}
					</span>
				)}
			</div>
		</button>
	);

	return (
		<div>
			{cost ? (
				<Tooltip>
					<TooltipTrigger asChild>{header}</TooltipTrigger>
					<TooltipContent side="left" sideOffset={6} className="p-0">
						<CostBreakdown cost={cost} />
					</TooltipContent>
				</Tooltip>
			) : (
				header
			)}

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
