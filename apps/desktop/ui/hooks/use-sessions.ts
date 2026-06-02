import { useCallback, useEffect, useState } from "react";
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
                        _workspacePath: string,
                        _title = "Untitled chat",
                ): Promise<Session> => {
                        const session = await ipcInvoke("session.createRequested", { provider });
                        // No need to enrich here, session comes back from projector already containing the true state
                        setSessions((prev) => [session, ...prev]);
                        return session;
                },
                [],
        );

        return { sessions, createSession, loading };
}
