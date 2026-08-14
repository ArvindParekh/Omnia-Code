import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, CompleteAttachment, QuoteRef, TurnGroup } from "../lib/types";
import { ipcInvoke, useIpcEvent } from "./use-ipc";

// Module-level cache so messages/turns survive SessionChat remounts when
// navigating between sessions. Keyed by sessionId.
type SessionCache = { messages: ChatMessage[]; turns: TurnGroup[] };
const sessionCache = new Map<string, SessionCache>();

// Manages the full message state and event stream for a single session.
export function useMessages(sessionId: string) {
	const [messages, setMessages] = useState<ChatMessage[]>(
		() => sessionCache.get(sessionId)?.messages ?? [],
	);
	const [turns, setTurns] = useState<TurnGroup[]>(() => sessionCache.get(sessionId)?.turns ?? []);
	const [isRunning, setIsRunning] = useState(false);
	const [isCanceling, setIsCanceling] = useState(false);

	// Refs for mutable streaming state — stable across renders, safe in closures
	const streamingMsgId = useRef<string | null>(null);
	const currentTurnId = useRef<string | null>(null);
	const pendingStart = useRef<Promise<string> | null>(null);
	const cancelingRef = useRef(false);
	const turnIndex = useRef(0);

	// Write back to the cache on every change so a future remount picks up
	// where we left off.
	useEffect(() => {
		sessionCache.set(sessionId, { messages, turns });
	}, [sessionId, messages, turns]);

	// Stable — only closes over refs and stable setters, so deps can be [].
	const finalizeStream = useCallback((status: "done" | "canceled") => {
		if (streamingMsgId.current) {
			const id = streamingMsgId.current;
			streamingMsgId.current = null;
			setMessages((prev) =>
				prev.map((m) => (m.kind === "assistant" && m.id === id ? { ...m, streaming: false } : m)),
			);
		}
		const tid = currentTurnId.current;
		if (tid) {
			currentTurnId.current = null;
			setTurns((prev) => prev.map((t) => (t.id === tid ? { ...t, status } : t)));
		}
		setIsRunning(false);
		cancelingRef.current = false;
		setIsCanceling(false);
	}, []);

	useIpcEvent("app:event", ({ sessionId: evtSessionId, event }) => {
		if (evtSessionId !== sessionId) return;

		if (event.type === "message.assistantDeltaReceived") {
			// Determine or create the streaming message id OUTSIDE the updater.
			// setMessages updaters run twice in StrictMode — mutating the ref
			// inside the updater causes the second call to take a wrong branch.
			if (!streamingMsgId.current) {
				streamingMsgId.current = `asmsg-${Date.now()}`;
			}
			const msgId = streamingMsgId.current;
			setMessages((prev) => {
				const exists = prev.some((m) => m.kind === "assistant" && m.id === msgId);
				if (!exists) {
					return [
						...prev,
						{
							kind: "assistant",
							id: msgId,
							text: event.payload.text,
							streaming: true,
							timestamp: new Date(),
						},
					];
				}
				return prev.map((m) =>
					m.kind === "assistant" && m.id === msgId
						? { ...m, text: m.text + event.payload.text }
						: m,
				);
			});
			const turnId = currentTurnId.current;
			if (turnId) {
				setTurns((prev) =>
					prev.map((t) =>
						t.id === turnId
							? {
									...t,
									events: [
										...t.events,
										{
											id: `ev-delta-${Date.now()}`,
											type: "delta",
											summary: "message.assistantDelta",
											detail: event.payload.text.slice(0, 80),
											status: "running" as const,
										},
									],
								}
							: t,
					),
				);
			}
		} else if (event.type === "approval.requested") {
			setMessages((prev) => [
				...prev,
				{
					kind: "approval",
					id: event.payload.approvalId,
					toolName: event.payload.toolName,
					input: event.payload.input as Record<string, unknown>,
					resolved: false,
					timestamp: new Date(),
				},
			]);
			const turnId = currentTurnId.current;
			if (turnId) {
				setTurns((prev) =>
					prev.map((t) =>
						t.id === turnId
							? {
									...t,
									events: [
										...t.events,
										{
											id: `ev-approval-${Date.now()}`,
											type: "approval",
											summary: `approval.requested — ${event.payload.toolName}`,
											status: "pending" as const,
										},
									],
								}
							: t,
					),
				);
			}
		} else if (event.type === "turn.completed") {
			finalizeStream("done");
		} else if (event.type === "turn.canceled") {
			finalizeStream("canceled");
		} else if (event.type === "turn.failed") {
			setMessages((prev) => [
				...prev,
				{
					kind: "error",
					id: `err-${Date.now()}`,
					message: event.payload.message,
					timestamp: new Date(),
				},
			]);
			const turnId = currentTurnId.current;
			if (turnId) {
				currentTurnId.current = null;
				setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, status: "failed" } : t)));
			}
			setIsRunning(false);
			cancelingRef.current = false;
			setIsCanceling(false);
		}
	});

	const send = useCallback(
		(text: string, quote?: QuoteRef, attachments?: CompleteAttachment[]) => {
			if (!text.trim()) return;
			const optimisticTurnId = `pending-turn-${Date.now()}`;
			turnIndex.current += 1;
			currentTurnId.current = optimisticTurnId;

			setIsRunning(true);
			cancelingRef.current = false;
			setIsCanceling(false);
			setMessages((prev) => [
				...prev,
				{
					kind: "user",
					id: `msg-${Date.now()}`,
					text: text.trim(),
					quote,
					attachments,
					timestamp: new Date(),
				},
			]);
			setTurns((prev) => [
				...prev,
				{
					id: optimisticTurnId,
					index: turnIndex.current,
					status: "running",
					events: [
						{
							id: `ev-user-${Date.now()}`,
							type: "user",
							summary: "message.userCreated",
							detail: text.trim().slice(0, 80),
						},
					],
				},
			]);

			const start = ipcInvoke("turn.startRequested", { sessionId, text: text.trim() });
			pendingStart.current = start;

			start
				.then((turnId) => {
					if (currentTurnId.current === optimisticTurnId) {
						currentTurnId.current = turnId;
					}
					setTurns((prev) =>
						prev.map((turn) => (turn.id === optimisticTurnId ? { ...turn, id: turnId } : turn)),
					);
				})
				.catch((err: unknown) => {
					const message = err instanceof Error ? err.message : String(err);
					setMessages((prev) => [
						...prev,
						{ kind: "error", id: `err-${Date.now()}`, message, timestamp: new Date() },
					]);
					if (currentTurnId.current === optimisticTurnId) {
						currentTurnId.current = null;
						setTurns((prev) =>
							prev.map((turn) =>
								turn.id === optimisticTurnId ? { ...turn, status: "failed" } : turn,
							),
						);
					}
					setIsRunning(false);
					cancelingRef.current = false;
					setIsCanceling(false);
				})
				.finally(() => {
					if (pendingStart.current === start) {
						pendingStart.current = null;
					}
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
			const message = error instanceof Error ? error.message : String(error);
			setMessages((prev) => [
				...prev,
				{ kind: "error", id: `err-${Date.now()}`, message, timestamp: new Date() },
			]);
		}
	}, [sessionId]);

	const approve = useCallback(
		(approvalId: string, approved: boolean, note?: string) => {
			setMessages((prev) =>
				prev.map((m) =>
					m.kind === "approval" && m.id === approvalId
						? { ...m, resolved: true, approved, note }
						: m,
				),
			);
			ipcInvoke("approval.resolveRequested", { approvalId, approved, note });
		},
		[sessionId],
	);

	return { messages, turns, send, approve, isRunning, isCanceling, cancel };
}
