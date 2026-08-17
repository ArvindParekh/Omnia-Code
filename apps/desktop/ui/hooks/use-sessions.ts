import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Session } from "@omnia/contracts";
import type { Provider } from "../lib/types";
import { ipcInvoke, useIpcEvent } from "./use-ipc";

export function useSessions() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		ipcInvoke("app:getSessions", {})
			.then(setSessions)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	useIpcEvent("app:sessionDeleted", ({ sessionId }) => {
		setSessions((prev) => prev.filter((s) => s.id !== sessionId));
	});

	useIpcEvent("app:sessionUpdated", ({ session }) => {
		setSessions((prev) => {
			const idx = prev.findIndex((s) => s.id === session.id);
			if (idx === -1) return [session, ...prev];
			return prev.map((s) => (s.id === session.id ? session : s));
		});
	});

	const createSession = useCallback(
		async (
			provider: Provider,
			workspacePath: string,
			title = "Untitled chat",
		): Promise<Session> => {
			const session = await ipcInvoke("session.createRequested", {
				provider,
				workspacePath,
				title,
			});
			// No need to enrich here, session comes back from projector already containing the true state
			setSessions((prev) => [session, ...prev]);
			return session;
		},
		[],
	);

	const renameSession = useCallback(async (sessionId: string, title: string): Promise<void> => {
		try {
			await ipcInvoke("session.renameRequested", { sessionId, customTitle: title });
		} catch (error) {
			toast.error("Could not rename chat", {
				description: error instanceof Error ? error.message : String(error),
			});
		}
	}, []);

	const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
		try {
			await ipcInvoke("session.deleteRequested", { sessionId });
			toast.success("Chat deleted");
		} catch (error) {
			toast.error("Could not delete chat", {
				description: error instanceof Error ? error.message : String(error),
			});
		}
	}, []);

	return { sessions, createSession, renameSession, deleteSession, loading };
}
