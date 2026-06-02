import { useCallback, useRef, useState } from "react";
import type { ChatMessage, CompleteAttachment, QuoteRef, TurnGroup } from "../lib/types";
import { ipcInvoke, useIpcEvent } from "./use-ipc";

// Manages the full message state and event stream for a single session.
// The invoke on agent:sendMessage completes when the full response stream ends,
// so we use its resolution as the primary "done" signal. We also handle explicit
// done/error AgentEvent types for forward compatibility with future backend updates.
export function useMessages(sessionId: string) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [turns, setTurns] = useState<TurnGroup[]>([]);
	const [isRunning, setIsRunning] = useState(false);

	// Refs for mutable streaming state — stable across renders, safe in closures
	const streamingMsgId = useRef<string | null>(null);
	const currentTurnId = useRef<string | null>(null);
	const turnIndex = useRef(0);

	// Stable — only closes over refs and stable setters, so deps can be [].
	const finalizeStream = useCallback((explicitTurnId?: string) => {
		if (streamingMsgId.current) {
			const id = streamingMsgId.current;
			streamingMsgId.current = null;
			setMessages((prev) =>
				prev.map((m) => (m.kind === "assistant" && m.id === id ? { ...m, streaming: false } : m)),
			);
		}
		const tid = explicitTurnId ?? currentTurnId.current;
		if (tid) {
			currentTurnId.current = null;
			setTurns((prev) => prev.map((t) => (t.id === tid ? { ...t, status: "done" } : t)));
		}
		setIsRunning(false);
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
						{ kind: "assistant", id: msgId, text: event.payload.text, streaming: true, timestamp: new Date() },
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
		} else if (event.type === "turn.completed" || event.type === "turn.canceled") {
			finalizeStream();
		} else if (event.type === "turn.failed") {
			setMessages((prev) => [
				...prev,
				{ kind: "error", id: `err-${Date.now()}`, message: event.payload.message, timestamp: new Date() },
			]);
			const turnId = currentTurnId.current;
			if (turnId) {
				currentTurnId.current = null;
				setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, status: "failed" } : t)));
			}
			setIsRunning(false);
		}
	});

	const send = useCallback(
		(text: string, quote?: QuoteRef, attachments?: CompleteAttachment[]) => {
			if (!text.trim()) return;
			const turnId = `turn-${Date.now()}`;
			turnIndex.current += 1;
			currentTurnId.current = turnId;

			setIsRunning(true);
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
					id: turnId,
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

			// sendMessage invoke resolves when the full stream ends — treat as done signal
			ipcInvoke("turn.startRequested", { sessionId, text: text.trim() })
				.then(() => {
					// Guard: if a done event already handled this, currentTurnId will be null
					// if (currentTurnId.current === turnId) finalizeStream(turnId);
				})
				.catch((err: unknown) => {
					const message = err instanceof Error ? err.message : String(err);
					setMessages((prev) => [
						...prev,
						{ kind: "error", id: `err-${Date.now()}`, message, timestamp: new Date() },
					]);
					if (currentTurnId.current === turnId) {
						currentTurnId.current = null;
						setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, status: "failed" } : t)));
					}
					setIsRunning(false);
				});
		},
		[sessionId, finalizeStream],
	);

	const approve = useCallback(
		(approvalId: string, approved: boolean) => {
			setMessages((prev) =>
				prev.map((m) =>
					m.kind === "approval" && m.id === approvalId ? { ...m, resolved: true, approved } : m,
				),
			);
			ipcInvoke("approval.resolveRequested", { approvalId, approved });
		},
		[sessionId],
	);

	return { messages, turns, send, approve, isRunning };
}
