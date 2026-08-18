import { useCostSummary } from "../../hooks/use-cost-summary";
import { formatCost } from "../../lib/format";
import { providerLabel } from "../../lib/provider";
import type { Session, SessionViewItem, TurnGroup } from "../../lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TooltipProvider } from "../ui/tooltip";
import { SummaryTab } from "./summary-tab";
import { TurnSection } from "./turn-section";

type EventInspectorProps = {
	session: Session;
	turns: TurnGroup[];
	items: SessionViewItem[];
};

export function EventInspector({ session, turns, items }: EventInspectorProps) {
	const label = providerLabel(session.provider);
	const cost = useCostSummary(session.id);
	const totalEvents = turns.reduce((n, t) => n + t.events.length, 0);

	return (
		<TooltipProvider delayDuration={150}>
			<div className="flex h-full flex-col overflow-hidden bg-background">
				<div className="flex items-center justify-between px-4 py-3 border-b border-white/[6%] shrink-0">
					<span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/25">
						Inspector
					</span>
					<span className="text-[9px] font-mono text-white/18">{label}</span>
				</div>

				<Tabs defaultValue="activity" className="flex flex-1 flex-col overflow-hidden gap-0">
					<TabsList className="mx-3 mt-2 h-7 shrink-0">
						<TabsTrigger value="activity" className="text-[10px]">
							Activity
						</TabsTrigger>
						<TabsTrigger value="summary" className="text-[10px]">
							Summary
						</TabsTrigger>
					</TabsList>

					<TabsContent value="activity" className="flex-1 overflow-y-auto py-1">
						{turns.length === 0 ? (
							<div className="flex items-center justify-center py-10">
								<p className="text-[10px] text-white/20">No events</p>
							</div>
						) : (
							turns.map((turn) => (
								<TurnSection key={turn.id} turn={turn} cost={cost.perTurn[turn.id]} />
							))
						)}
					</TabsContent>

					<TabsContent value="summary" className="flex-1 overflow-y-auto">
						<SummaryTab items={items} cost={cost} turns={turns} />
					</TabsContent>
				</Tabs>

				<div className="flex items-center justify-between border-t border-white/[5%] px-4 py-2 shrink-0">
					<span className="text-[9px] font-mono text-white/18">
						{turns.length}t · {totalEvents}e
					</span>
					{cost.totalCostUsd > 0 && (
						<span className="text-[9px] font-mono tabular-nums text-white/30">
							{formatCost(cost.totalCostUsd)}
						</span>
					)}
				</div>
			</div>
		</TooltipProvider>
	);
}
