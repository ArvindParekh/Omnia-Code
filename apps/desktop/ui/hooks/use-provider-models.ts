import type { ModelInfo, Provider } from "@omnia/contracts";
import { useCallback, useEffect, useState } from "react";
import { ipcInvoke, useIpcEvent } from "./use-ipc";

export function useProviderModels(provider: Provider): {
	models: ModelInfo[];
	selectionSupported: boolean;
} {
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [selectionSupported, setSelectionSupported] = useState(false);

	const refresh = useCallback(() => {
		let cancelled = false;

		ipcInvoke("app:detectProviderModels", { provider })
			.then((capabilities) => {
				if (cancelled || capabilities.provider !== provider) return;
				setModels(capabilities.discoveredModels);
				setSelectionSupported(capabilities.selectionSupported);
			})
			.catch(() => {
				if (!cancelled) setModels([]);
			});

		return () => {
			cancelled = true;
		};
	}, [provider]);

	useEffect(() => refresh(), [refresh]);

	// The real list only exists once a turn has run, so re-read when one lands.
	useIpcEvent("app:event", ({ event }) => {
		if (event.type === "turn.completed") refresh();
	});

	return { models, selectionSupported };
}
