import { useEffect, useState } from "react";
import type { Provider } from "@omnia/contracts";
import { ipcInvoke } from "./use-ipc";

const ALL_PROVIDERS: Provider[] = ["claude", "gemini", "codex", "opencode", "cursor", "fake"];

export function useProviders() {
	const [available, setAvailable] = useState<Provider[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		ipcInvoke("app:detectProviders", {})
			.then(setAvailable)
			.catch(() => setAvailable([]))
			.finally(() => setLoading(false));
	}, []);

	// Fall back to all known providers when detection hasn't completed or returns nothing.
	// This prevents the UI from showing an empty provider list while the backend loads.
	const providers = loading || available.length === 0 ? ALL_PROVIDERS : available;

	return { providers, available, loading };
}
