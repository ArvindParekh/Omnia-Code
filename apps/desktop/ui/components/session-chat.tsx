import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssistantRuntimeProvider, useExternalStoreRuntime } from "@assistant-ui/react";
import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import type { CompleteAttachment, EffortLevel, QuoteRef, Session } from "../lib/types";
import { AnyFileAttachmentAdapter } from "../lib/attachment-adapter";
import { convertToThreadMessages } from "../lib/convert-messages";
import { ApprovalContext } from "./approval-card";
import { ChatThread } from "./chat-thread";
import { EventInspector } from "./event-inspector";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { useMessages } from "../hooks/use-messages";
import { usePanelLayout } from "../hooks/use-panel-layout";

export type InitialTurn = {
	text: string;
	modelId: string | null;
	effort: EffortLevel | null;
};

type SessionChatProps = {
	session: Session;
	showInspector: boolean;
	initialTurn?: InitialTurn;
	onInitialTurnSent?: () => void;
};

export function SessionChat({
	session,
	showInspector,
	initialTurn,
	onInitialTurnSent,
}: SessionChatProps) {
	const { messages, turns, send, approve, isRunning, isCanceling, cancel } = useMessages(
		session.id,
	);

	// Fire the initial message once on mount (only when creating a new session
	// from the NewChat screen — the ref guards against double-sends on StrictMode).
	const sessionLayout = usePanelLayout("session");
	const [modelId, setModelId] = useState<string | null>(
		initialTurn?.modelId ?? (session.model?.mode === "explicit" ? session.model.modelId : null),
	);
	const [effort, setEffort] = useState<EffortLevel | null>(
		initialTurn?.effort ?? session.effort ?? null,
	);

	const initialSent = useRef(false);
	useEffect(() => {
		if (initialTurn?.text.trim() && !initialSent.current) {
			initialSent.current = true;
			send(initialTurn.text.trim(), undefined, undefined, {
				model: initialTurn.modelId ? { mode: "explicit", modelId: initialTurn.modelId } : undefined,
				effort: initialTurn.effort ?? undefined,
			});
			onInitialTurnSent?.();
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const threadMessages = useMemo(() => convertToThreadMessages(messages), [messages]);

	const onNew = useCallback(
		async (msg: AppendMessage) => {
			const first = msg.content[0];
			const quote = msg.metadata?.custom?.quote as QuoteRef | undefined;
			const attachments = msg.attachments?.length
				? ([...msg.attachments] as CompleteAttachment[])
				: undefined;
			if (first?.type === "text") {
				send(first.text, quote, attachments, {
					model: modelId ? { mode: "explicit", modelId } : undefined,
					effort: effort ?? undefined,
				});
			}
		},
		[send, modelId, effort],
	);

	const onCancel = useCallback(async () => {
		await cancel();
	}, [cancel]);

	const runtime = useExternalStoreRuntime({
		messages: threadMessages as ThreadMessageLike[],
		convertMessage: (msg: ThreadMessageLike) => msg,
		isRunning,
		onNew,
		onCancel,
		adapters: { attachments: new AnyFileAttachmentAdapter() },
	});

	return (
		<ApprovalContext.Provider value={{ onApprove: approve }}>
			<AssistantRuntimeProvider runtime={runtime}>
				<ResizablePanelGroup
					orientation="horizontal"
					{...sessionLayout}
					className="flex-1 overflow-hidden rounded-l-lg border-l border-l-white/10 shadow-2xl"
				>
					<ResizablePanel id="thread" minSize="40%" style={{ overflow: "hidden" }}>
						<ChatThread
							session={session}
							isCanceling={isCanceling}
							modelId={modelId}
							onModelChange={setModelId}
							effort={effort}
							onEffortChange={setEffort}
						/>
					</ResizablePanel>

					{showInspector && (
						<>
							<ResizableHandle />
							<ResizablePanel
								id="inspector"
								defaultSize="24%"
								minSize="16%"
								maxSize="45%"
								style={{ overflow: "hidden" }}
							>
								<EventInspector session={session} turns={turns} items={messages} />
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>
			</AssistantRuntimeProvider>
		</ApprovalContext.Provider>
	);
}
