import { DEFAULT_PREFERENCES, type Preferences } from "@omnia/contracts";
import { useCallback, useEffect, useState } from "react";
import { ipcInvoke } from "./use-ipc";

export function usePreferences() {
	const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		ipcInvoke("app:getPreferences", {})
			.then(setPreferences)
			.catch(console.error)
			.finally(() => setLoaded(true));
	}, []);

	// Applied locally before the write lands so the UI never waits on disk.
	const update = useCallback((values: Partial<Preferences>) => {
		setPreferences((prev) => ({ ...prev, ...values }));
		ipcInvoke("app:setPreferences", { values }).catch(console.error);
	}, []);

	return { preferences, loaded, update };
}
