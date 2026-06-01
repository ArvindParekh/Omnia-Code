import { useCallback, useEffect, useState } from "react";
import type { Session } from "@omnia/contracts";
import type { Provider } from "../lib/types";
import { ipcInvoke, useIpcEvent } from "./use-ipc";

export function useSessions() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		ipcInvoke("agent:getSessions", {})
			.then(setSessions)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	useIpcEvent("agent:sessionUpdated", ({ session }) => {
		setSessions((prev) => {
			const idx = prev.findIndex((s) => s.id === session.id);
			if (idx === -1) return [session, ...prev];
			return prev.map((s) => (s.id === session.id ? session : s));
		});
	});

	// workspacePath becomes workspaceId until the IPC contract supports explicit
	// workspace selection — the backend will need to be updated to accept it.
	const createSession = useCallback(
		async (
			provider: Provider,
			workspacePath: string,
			title = "Untitled chat",
		): Promise<Session> => {
			const session = await ipcInvoke("agent:createSession", { provider });
			const enriched: Session = { ...session, title, workspaceId: workspacePath };
			setSessions((prev) => [enriched, ...prev]);
			return enriched;
		},
		[],
	);

	return { sessions, createSession, loading };
}
