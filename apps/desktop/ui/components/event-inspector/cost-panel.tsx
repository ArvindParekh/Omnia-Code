import type { CostSummary, TokenUsage } from "@omnia/contracts";
import { useMemo, useState } from "react";
import { formatCost, formatTokens } from "../../lib/format";
import type { TurnGroup } from "../../lib/types";

function sumTokens(usage: TokenUsage): number {
	return (
		usage.input_tokens +
		usage.output_tokens +
		usage.cache_read_input_tokens +
		usage.cache_creation_input_tokens
	);
}

function TokenStat({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-[11px] font-medium tabular-nums text-white/70">
				{formatTokens(value)}
			</span>
			<span className="text-[9px] uppercase tracking-[0.08em] text-white/22">{label}</span>
		</div>
	);
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
	return (
		<div className="flex items-baseline justify-between px-4">
			<span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/22">
				{title}
			</span>
			{right}
		</div>
	);
}

export function CostPanel({ cost, turns }: { cost: CostSummary; turns: TurnGroup[] }) {
	const [sortByCost, setSortByCost] = useState(true);

	const turnMeta = useMemo(() => {
		const map = new Map<string, { index: number; title: string }>();
		for (const turn of turns) map.set(turn.id, { index: turn.index, title: turn.title });
		return map;
	}, [turns]);

	const turnRows = useMemo(() => {
		const rows = Object.values(cost.perTurn);
		return rows.sort((a, b) =>
			sortByCost
				? b.totalCostUsd - a.totalCostUsd
				: (turnMeta.get(a.turnId)?.index ?? 0) - (turnMeta.get(b.turnId)?.index ?? 0),
		);
	}, [cost.perTurn, sortByCost, turnMeta]);

	const modelRows = useMemo(
		() => Object.entries(cost.perModel).sort((a, b) => b[1].costUsd - a[1].costUsd),
		[cost.perModel],
	);

	const maxTurnCost = turnRows.reduce((max, turn) => Math.max(max, turn.totalCostUsd), 0);
	const totalTokens = sumTokens(cost.usage);

	if (cost.totalCostUsd <= 0 && totalTokens === 0) {
		return (
			<div className="px-4 py-3">
				<span className="text-[10px] text-white/20">No usage recorded yet</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-end justify-between px-4">
				<div className="flex flex-col gap-1">
					<span className="text-[22px] font-semibold leading-none tabular-nums text-white/[0.88]">
						{formatCost(cost.totalCostUsd)}
					</span>
					<span className="text-[9px] uppercase tracking-[0.08em] text-white/22">
						Total · API-equiv est.
					</span>
				</div>
				<div className="flex flex-col items-end gap-1">
					<span className="text-[13px] font-medium tabular-nums text-white/55">
						{formatTokens(totalTokens)}
					</span>
					<span className="text-[9px] uppercase tracking-[0.08em] text-white/22">Tokens</span>
				</div>
			</div>

			<div className="grid grid-cols-4 gap-y-3 px-4">
				<TokenStat label="Input" value={cost.usage.input_tokens} />
				<TokenStat label="Output" value={cost.usage.output_tokens} />
				<TokenStat label="Cache rd" value={cost.usage.cache_read_input_tokens} />
				<TokenStat label="Cache wr" value={cost.usage.cache_creation_input_tokens} />
			</div>

			{turnRows.length > 0 && (
				<div className="flex flex-col gap-1">
					<SectionHeader
						title="Cost per turn"
						right={
							<button
								type="button"
								onClick={() => setSortByCost((value) => !value)}
								className="font-mono text-[9px] text-white/25 transition-colors hover:text-white/50"
							>
								{sortByCost ? "cost ↓" : "order"}
							</button>
						}
					/>
					<div className="flex flex-col">
						{turnRows.map((row) => {
							const meta = turnMeta.get(row.turnId);
							const tokens = sumTokens(row.usage);
							const pct = maxTurnCost > 0 ? (row.totalCostUsd / maxTurnCost) * 100 : 0;
							return (
								<div
									key={row.turnId}
									className="flex items-center gap-2 px-4 py-[3px] transition-colors hover:bg-white/[3%]"
								>
									<span className="w-3.5 shrink-0 font-mono text-[9px] tabular-nums text-white/20">
										{meta?.index ?? "–"}
									</span>
									<span
										className="min-w-0 flex-1 truncate text-[10px] text-white/48"
										title={meta?.title}
									>
										{meta?.title ?? row.turnId}
									</span>
									<div className="h-[3px] w-10 shrink-0 overflow-hidden rounded-full bg-white/[6%]">
										<div className="h-full rounded-full bg-white/25" style={{ width: `${pct}%` }} />
									</div>
									<span className="w-9 shrink-0 text-right font-mono text-[9px] tabular-nums text-white/25">
										{formatTokens(tokens)}
									</span>
									<span className="w-11 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/70">
										{formatCost(row.totalCostUsd)}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{modelRows.length > 0 && (
				<div className="flex flex-col gap-1">
					<SectionHeader title="Cost per model" />
					<div className="flex flex-col">
						{modelRows.map(([modelId, usage]) => (
							<div
								key={modelId}
								className="flex items-center gap-2 px-4 py-[3px] transition-colors hover:bg-white/[3%]"
							>
								<span
									className="min-w-0 flex-1 truncate font-mono text-[10px] text-white/48"
									title={modelId}
								>
									{modelId}
								</span>
								<span className="w-9 shrink-0 text-right font-mono text-[9px] tabular-nums text-white/25">
									{formatTokens(sumTokens(usage))}
								</span>
								<span className="w-11 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/70">
									{formatCost(usage.costUsd)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
