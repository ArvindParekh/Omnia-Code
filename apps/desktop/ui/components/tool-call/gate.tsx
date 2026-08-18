import { ShieldCheck } from "@phosphor-icons/react";
import { createContext, useContext } from "react";
import { clockTime } from "../../lib/time";
import type { GateInfo } from "../../lib/types";

const GateContext = createContext<GateInfo | null>(null);

export const GateProvider = GateContext.Provider;

export function useGate(): GateInfo | null {
	return useContext(GateContext);
}

export function GateHeader({ gate }: { gate: GateInfo }) {
	return (
		<div
			className="flex items-center gap-2 px-3.5 py-1.5 border-b"
			style={{ borderColor: "var(--warn-border)", backgroundColor: "var(--warn-bg)" }}
		>
			<ShieldCheck size={11} weight="fill" style={{ color: "var(--warn)", opacity: 0.75 }} />
			<span className="text-[10px] text-white/45">You approved this</span>
			<span className="ml-auto text-[9px] font-mono text-white/25">
				{clockTime(gate.approvedAt)}
			</span>
		</div>
	);
}
