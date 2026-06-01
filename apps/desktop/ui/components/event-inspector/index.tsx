import type { Session, TurnGroup } from "../../lib/types";
import { providerLabel } from "../../lib/provider";
import { TurnSection } from "./turn-section";

type EventInspectorProps = {
	session: Session;
	turns: TurnGroup[];
};

export function EventInspector({ session, turns }: EventInspectorProps) {
	const label = providerLabel(session.provider);
	const totalEvents = turns.reduce((n, t) => n + t.events.length, 0);

	return (
		<div className="flex flex-col w-[256px] shrink-0 overflow-hidden bg-background">
			<div className="flex items-center justify-between px-4 py-3 border-b border-white/[6%] shrink-0">
				<span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
					Inspector
				</span>
				<span className="text-[10px] font-mono text-white/18">{label}</span>
			</div>

			<div className="flex-1 overflow-y-auto py-1">
				{turns.length === 0 ? (
					<div className="flex items-center justify-center py-10">
						<p className="text-[11px] text-white/20">No events</p>
					</div>
				) : (
					turns.map((turn) => <TurnSection key={turn.id} turn={turn} />)
				)}
			</div>

			<div className="border-t border-white/[5%] px-4 py-2 shrink-0">
				<span className="text-[10px] font-mono text-white/18">
					{turns.length}t · {totalEvents}e
				</span>
			</div>
		</div>
	);
}
