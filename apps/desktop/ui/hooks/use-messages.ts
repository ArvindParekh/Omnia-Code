import { SessionViewProjector } from "@omnia/app-server/projections";
import type { AllEvents, EffortLevel, EventType, ModelSelection } from "@omnia/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { takeAttachments } from "../lib/attachment-adapter";
import { groupIntoTurns } from "../lib/turns";
import type { CompleteAttachment, QuoteRef, SessionViewItem } from "../lib/types";
import { ipcInvoke, useIpcEvent } from "./use-ipc";

export function useMessages(sessionId: string) {
	const [items, setItems] = useState<SessionViewItem[]>([]);
	const [localErrors, setLocalErrors] = useState<SessionViewItem[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const [isCanceling, setIsCanceling] = useState(false);

	const projector = useRef(new SessionViewProjector());
	const lastSeq = useRef(0);
	const hydrated = useRef(false);
	const buffered = useRef<AllEvents<EventType>[]>([]);
	const currentTurnId = useRef<string | null>(null);
	const pendingStart = useRef<Promise<string> | null>(null);
	const cancelingRef = useRef(false);

	useEffect(() => {
		let cancelled = false;

		projector.current = new SessionViewProjector();
		lastSeq.current = 0;
		hydrated.current = false;
		buffered.current = [];
		setItems([]);
		setLocalErrors([]);

		ipcInvoke("app:getSessionView", { sessionId }).then((view) => {
			if (cancelled || view.sessionId !== sessionId) return;

			projector.current.state.set(sessionId, view);
			lastSeq.current = view.lastSeq;

			for (const event of buffered.current) {
				if (event.seq <= lastSeq.current) continue;
				projector.current.apply(event);
			}
			buffered.current = [];
			hydrated.current = true;

			setItems(projector.current.state.get(sessionId)?.items ?? view.items);
		});

		return () => {
			cancelled = true;
		};
	}, [sessionId]);

	useIpcEvent("app:event", ({ sessionId: evtSessionId, event }) => {
		if (evtSessionId !== sessionId) return;

		if (!hydrated.current) {
			buffered.current.push(event);
			return;
		}
		if (event.seq <= lastSeq.current) return;

		projector.current.apply(event);
		const view = projector.current.state.get(sessionId);
		if (view) {
			lastSeq.current = view.lastSeq;
			setItems(view.items);
		}

		if (
			event.type === "turn.completed" ||
			event.type === "turn.canceled" ||
			event.type === "turn.failed"
		) {
			currentTurnId.current = null;
			cancelingRef.current = false;
			setIsRunning(false);
			setIsCanceling(false);
		}
	});

	const send = useCallback(
		(
			text: string,
			quote?: QuoteRef,
			attachments?: CompleteAttachment[],
			selection?: { model?: ModelSelection; effort?: EffortLevel },
		) => {
			if (!text.trim()) return;

			setLocalErrors([]);
			setIsRunning(true);
			cancelingRef.current = false;
			setIsCanceling(false);

			const start = ipcInvoke("turn.startRequested", {
				sessionId,
				text: text.trim(),
				attachments: takeAttachments((attachments ?? []).map((a) => a.id)),
				quote,
				model: selection?.model,
				effort: selection?.effort,
			});
			pendingStart.current = start;

			start
				.then((turnId) => {
					currentTurnId.current = turnId;
				})
				.catch((error: unknown) => {
					currentTurnId.current = null;
					cancelingRef.current = false;
					setIsRunning(false);
					setIsCanceling(false);
					setLocalErrors([
						{
							kind: "error",
							id: `local-${Date.now()}`,
							turnId: "local",
							message: error instanceof Error ? error.message : String(error),
							retryable: false,
							createdAt: Date.now(),
						},
					]);
				})
				.finally(() => {
					if (pendingStart.current === start) pendingStart.current = null;
				});
		},
		[sessionId],
	);

	const cancel = useCallback(async () => {
		if (cancelingRef.current) return;
		cancelingRef.current = true;
		setIsCanceling(true);

		try {
			const turnId = pendingStart.current ? await pendingStart.current : currentTurnId.current;
			if (!turnId) {
				cancelingRef.current = false;
				setIsCanceling(false);
				return;
			}
			await ipcInvoke("turn.cancelRequested", { sessionId, turnId });
		} catch (error) {
			cancelingRef.current = false;
			setIsCanceling(false);
			setLocalErrors([
				{
					kind: "error",
					id: `local-${Date.now()}`,
					turnId: "local",
					message: error instanceof Error ? error.message : String(error),
					retryable: false,
					createdAt: Date.now(),
				},
			]);
		}
	}, [sessionId]);

	const approve = useCallback(
		(approvalId: string, approved: boolean, note?: string) => {
			ipcInvoke("approval.resolveRequested", { sessionId, approvalId, approved, note });
		},
		[sessionId],
	);

	const messages = useMemo(() => [...items, ...localErrors], [items, localErrors]);
	const turns = useMemo(() => groupIntoTurns(messages), [messages]);

	return { messages, turns, send, approve, isRunning, isCanceling, cancel };
}
