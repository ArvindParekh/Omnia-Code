import { useEffect, useMemo, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { AssistantRuntimeProvider, useExternalStoreRuntime } from "@assistant-ui/react";
import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import type { ChatMessage, MockSession, Provider, QuoteRef, TurnGroup } from "./lib/types";
import { AnyFileAttachmentAdapter } from "./lib/attachment-adapter";
import { MESSAGES, SESSIONS, TURNS } from "./lib/mock-data";
import { convertToThreadMessages } from "./lib/convert-messages";
import { ApprovalContext } from "./components/approval-card";
import { Titlebar } from "./components/titlebar";
import { SessionSidebar } from "./components/session-sidebar";
import { ChatThread } from "./components/chat-thread";
import { EventInspector } from "./components/event-inspector";
import { NewChat } from "./components/new-chat";

// ─── Session runtime bridge ───────────────────────────────────────────────────
// Converts our ChatMessage[] into the format @assistant-ui/react expects and
// wraps the thread in the runtime context. Keyed on session ID so each session
// gets a fresh runtime instance when switching.

type SessionChatProps = {
	session: MockSession;
	messages: ChatMessage[];
	turns: TurnGroup[];
	showInspector: boolean;
	onApprove: (id: string, approved: boolean) => void;
	onSend: (text: string, quote?: QuoteRef) => void;
};

function SessionChat({
	session,
	messages,
	turns,
	showInspector,
	onApprove,
	onSend,
}: SessionChatProps) {
	const threadMessages = useMemo(() => convertToThreadMessages(messages), [messages]);

	const runtime = useExternalStoreRuntime({
		messages: threadMessages as ThreadMessageLike[],
		convertMessage: (msg: ThreadMessageLike) => msg,
		isRunning: session.status === "running",
		onNew: async (msg: AppendMessage) => {
			const first = msg.content[0];
			// The composer stores the selected snippet at metadata.custom.quote
			// (assistant-ui's QuoteInfo). Carry it onto our user message so it
			// persists as a quote chip after sending.
			const quote = msg.metadata?.custom?.quote as QuoteRef | undefined;
			if (first && first.type === "text") onSend(first.text, quote);
		},
		adapters: {
			attachments: new AnyFileAttachmentAdapter(),
		},
	});

	return (
		<ApprovalContext.Provider value={{ onApprove }}>
			<AssistantRuntimeProvider runtime={runtime}>
				<div className="flex flex-1 overflow-hidden">
					<ChatThread session={session} />
					{showInspector && (
						<>
							{/* Rounded pill separator between chat and inspector */}
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
	const [sessions, setSessions] = useState<MockSession[]>(SESSIONS);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(MESSAGES);
	const [showInspector, setShowInspector] = useState(true);

	const [isDark, setIsDark] = useState(true);
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
	const activeMessages = activeId ? (messages[activeId] ?? []) : [];
	const activeTurns = activeId ? (TURNS[activeId] ?? []) : [];

	const handleSend = (text: string, quote?: QuoteRef) => {
		if (!activeId || !text.trim()) return;
		setMessages((prev) => ({
			...prev,
			[activeId]: [
				...(prev[activeId] ?? []),
				{ kind: "user", id: `msg-${Date.now()}`, text: text.trim(), quote, timestamp: new Date() },
			],
		}));
	};

	const handleApprove = (msgId: string, approved: boolean) => {
		if (!activeId) return;
		setMessages((prev) => ({
			...prev,
			[activeId]: (prev[activeId] ?? []).map((m) =>
				m.kind === "approval" && m.id === msgId ? { ...m, resolved: true, approved } : m,
			),
		}));
	};

	const handleNewSession = (text: string, provider: Provider, workspacePath: string) => {
		const id = `session-${Date.now()}`;
		const newSession: MockSession = {
			id,
			title: text.length > 40 ? `${text.slice(0, 40)}…` : text,
			provider,
			status: "idle",
			workspacePath,
			updatedAt: new Date(),
		};
		setSessions((prev) => [newSession, ...prev]);
		setMessages((prev) => ({
			...prev,
			[id]: [{ kind: "user", id: `msg-${Date.now()}`, text, timestamp: new Date() }],
		}));
		setActiveId(id);
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
				/>
				{/* Rounded pill separator between sidebar and main content */}
				<div className="shrink-0 self-stretch py-3 flex">
					<div className="w-px bg-white/[7%] rounded-full" />
				</div>
				<div ref={contentRef} className="flex flex-1 overflow-hidden">
					{activeSession ? (
						<SessionChat
							key={activeId}
							session={activeSession}
							messages={activeMessages}
							turns={activeTurns}
							showInspector={showInspector}
							onApprove={handleApprove}
							onSend={handleSend}
						/>
					) : (
						<NewChat onStart={handleNewSession} recentSessions={sessions} />
					)}
				</div>
			</div>
		</div>
	);
}
