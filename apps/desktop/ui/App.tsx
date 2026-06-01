import { useEffect, useMemo, useRef, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { AssistantRuntimeProvider, useExternalStoreRuntime } from "@assistant-ui/react";
import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import type { CompleteAttachment, Provider, QuoteRef, Session } from "./lib/types";
import { AnyFileAttachmentAdapter } from "./lib/attachment-adapter";
import { convertToThreadMessages } from "./lib/convert-messages";
import { ApprovalContext } from "./components/approval-card";
import { Titlebar } from "./components/titlebar";
import { SessionSidebar } from "./components/session-sidebar";
import { ChatThread } from "./components/chat-thread";
import { EventInspector } from "./components/event-inspector";
import { NewChat } from "./components/new-chat";
import { useSessions } from "./hooks/use-sessions";
import { useMessages } from "./hooks/use-messages";
import { useProviders } from "./hooks/use-providers";

// ─── Session runtime bridge ───────────────────────────────────────────────────
// Mounts once per active session (keyed by id). Owns message state via
// useMessages, wires the @assistant-ui runtime, and sends the initial message
// if one was queued when the session was created.

type SessionChatProps = {
	session: Session;
	showInspector: boolean;
	initialMessage?: string;
};

function SessionChat({ session, showInspector, initialMessage }: SessionChatProps) {
	const { messages, turns, send, approve, isRunning } = useMessages(session.id);

	// Fire the initial message once on mount (only when creating a new session
	// from the NewChat screen — the ref guards against double-sends on StrictMode).
	const initialSent = useRef(false);
	useEffect(() => {
		if (initialMessage?.trim() && !initialSent.current) {
			initialSent.current = true;
			send(initialMessage.trim());
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const threadMessages = useMemo(() => convertToThreadMessages(messages), [messages]);

	const runtime = useExternalStoreRuntime({
		messages: threadMessages as ThreadMessageLike[],
		convertMessage: (msg: ThreadMessageLike) => msg,
		isRunning,
		onNew: async (msg: AppendMessage) => {
			const first = msg.content[0];
			const quote = msg.metadata?.custom?.quote as QuoteRef | undefined;
			const attachments = msg.attachments?.length
				? ([...msg.attachments] as CompleteAttachment[])
				: undefined;
			if (first?.type === "text") send(first.text, quote, attachments);
		},
		adapters: { attachments: new AnyFileAttachmentAdapter() },
	});

	return (
		<ApprovalContext.Provider value={{ onApprove: approve }}>
			<AssistantRuntimeProvider runtime={runtime}>
				<div className="flex flex-1 border-l border-l-white/10 rounded-l-lg shadow-2xl overflow-hidden">
					<ChatThread session={session} />
					{showInspector && (
						<>
							<div className="shrink-0 self-stretch py-3 flex">
								<div className="w-px bg-white/[7%] rounded-full" />
							</div>
							<EventInspector session={session} turns={turns} />
						</>
					)}
				</div>
			</AssistantRuntimeProvider>
		</ApprovalContext.Provider>
	);
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
	const { sessions, createSession } = useSessions();
	const { providers } = useProviders();
	const [activeId, setActiveId] = useState<string | null>(null);
	const [showInspector, setShowInspector] = useState(true);
	const [isDark, setIsDark] = useState(true);

	// Tracks the initial message to send when a new session is created from
	// NewChat. Keyed by session ID so switching to an existing session never
	// accidentally fires the wrong pending message.
	const [sessionInitials, setSessionInitials] = useState<Record<string, string>>({});

	const [contentRef] = useAutoAnimate<HTMLDivElement>((el, action) => {
		if (action === "remain") return new KeyframeEffect(el, [], { duration: 0 });
		return new KeyframeEffect(
			el,
			action === "add" ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
			{ duration: 120, easing: "ease-in-out" },
		);
	});

	useEffect(() => {
		const root = document.documentElement;
		root.classList.toggle("dark", isDark);
		root.classList.toggle("light", !isDark);
	}, [isDark]);

	const activeSession = sessions.find((s) => s.id === activeId) ?? null;

	const handleNewSession = async (text: string, provider: Provider, workspacePath: string) => {
		const title = text.length > 40 ? `${text.slice(0, 40)}…` : text;
		const session = await createSession(provider, workspacePath, title);
		setSessionInitials((prev) => ({ ...prev, [session.id]: text }));
		setActiveId(session.id);
	};

	const handleCreateWorkspaceSession = async (workspaceId: string) => {
		const wsSessions = sessions.filter((s) => s.workspaceId === workspaceId);
		const provider = wsSessions[0]?.provider ?? "claude";
		const session = await createSession(provider, workspaceId);
		setActiveId(session.id);
	};

	return (
		<div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
			<Titlebar
				showInspector={showInspector}
				onToggleInspector={() => setShowInspector((v) => !v)}
				isDark={isDark}
				onToggleTheme={() => setIsDark((v) => !v)}
			/>
			<div className="flex flex-1 overflow-hidden">
				<SessionSidebar
					sessions={sessions}
					activeSessionId={activeId}
					onSelectSession={setActiveId}
					onCreateWorkspaceSession={handleCreateWorkspaceSession}
				/>
				<div ref={contentRef} className="flex flex-1 overflow-hidden">
					{activeSession ? (
						<SessionChat
							key={activeId}
							session={activeSession}
							showInspector={showInspector}
							initialMessage={activeId ? sessionInitials[activeId] : undefined}
						/>
					) : (
						<NewChat onStart={handleNewSession} recentSessions={sessions} providers={providers} />
					)}
				</div>
			</div>
		</div>
	);
}
