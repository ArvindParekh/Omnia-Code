import type { CostSummary } from "@omnia/contracts";
import { useEffect, useState } from "react";
import { ipcInvoke, useIpcEvent } from "./use-ipc";

function emptyCost(sessionId: string): CostSummary {
	return {
		sessionId,
		totalCostUsd: 0,
		usage: {
			input_tokens: 0,
			output_tokens: 0,
			cache_read_input_tokens: 0,
			cache_creation_input_tokens: 0,
		},
		perModel: {},
		perTurn: {},
	};
}

export function useCostSummary(sessionId: string): CostSummary {
	const [cost, setCost] = useState<CostSummary>(() => emptyCost(sessionId));

	useEffect(() => {
		let active = true;
		setCost(emptyCost(sessionId));
		ipcInvoke("app:getCostSummary", { sessionId }).then((next) => {
			if (active) setCost(next);
		});
		return () => {
			active = false;
		};
	}, [sessionId]);

	useIpcEvent("app:event", ({ sessionId: eventSessionId, event }) => {
		if (eventSessionId !== sessionId || event.type !== "cost.metered") return;
		ipcInvoke("app:getCostSummary", { sessionId }).then(setCost);
	});

	return cost;
}
