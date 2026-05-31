import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AssistantRuntimeProvider, useExternalStoreRuntime } from "@assistant-ui/react";
import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import { Titlebar } from "./components/titlebar";
import { SessionSidebar } from "./components/session-sidebar";
import { ChatThread } from "./components/chat-thread";
import { EventInspector } from "./components/event-inspector";
import { NewChat } from "./components/new-chat";
import { convertToThreadMessages } from "./lib/convert-messages";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type Provider = "claude" | "gemini" | "codex" | "opencode" | "cursor" | "fake";

export type MockSession = {
	id: string;
	title: string;
	provider: Provider;
	status: "idle" | "running" | "error";
	workspacePath: string;
	updatedAt: Date;
};

export type ChatMessage =
	| { kind: "user"; id: string; text: string; timestamp: Date }
	| { kind: "assistant"; id: string; text: string; streaming?: boolean; timestamp: Date }
	| {
			kind: "tool";
			id: string;
			name: string;
			input: Record<string, unknown>;
			status: "running" | "done" | "error";
			output?: string;
			timestamp: Date;
	  }
	| {
			kind: "approval";
			id: string;
			toolName: string;
			input: Record<string, unknown>;
			resolved: boolean;
			approved?: boolean;
			timestamp: Date;
	  }
	| { kind: "error"; id: string; message: string; timestamp: Date };

export type InspectorEvent = {
	id: string;
	type: string;
	summary: string;
	detail?: string;
	status?: "done" | "running" | "error" | "pending";
};

export type TurnGroup = {
	id: string;
	index: number;
	status: "done" | "running" | "failed" | "canceled";
	durationMs?: number;
	events: InspectorEvent[];
};

// ─── Contexts ─────────────────────────────────────────────────────────────────

type ApprovalContextValue = {
	onApprove: (id: string, approved: boolean) => void;
};

const ApprovalContext = createContext<ApprovalContextValue | null>(null);

export function useApproval() {
	const ctx = useContext(ApprovalContext);
	if (!ctx) throw new Error("useApproval must be inside ApprovalContext.Provider");
	return ctx;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const T = (offsetMinutes: number): Date => new Date(Date.now() - offsetMinutes * 60 * 1000);

const SESSIONS: MockSession[] = [
	{
		id: "s1",
		title: "Refactor auth middleware",
		provider: "claude",
		status: "idle",
		workspacePath: "~/projects/webapp",
		updatedAt: T(14),
	},
	{
		id: "s2",
		title: "Fix memory leak in worker",
		provider: "gemini",
		status: "running",
		workspacePath: "~/projects/webapp",
		updatedAt: T(0),
	},
	{
		id: "s3",
		title: "Deploy to staging",
		provider: "claude",
		status: "running",
		workspacePath: "~/projects/webapp",
		updatedAt: T(3),
	},
	{
		id: "s4",
		title: "Add search feature",
		provider: "codex",
		status: "error",
		workspacePath: "~/projects/storefront",
		updatedAt: T(120),
	},
];

const MESSAGES: Record<string, ChatMessage[]> = {
	s1: [
		{
			kind: "user",
			id: "m1",
			text: "Refactor the auth middleware to use the jose library instead of jsonwebtoken. Keep it backward compatible.",
			timestamp: T(20),
		},
		{
			kind: "assistant",
			id: "m2",
			text: "I'll start by reading the current middleware implementation.",
			timestamp: T(19),
		},
		{
			kind: "tool",
			id: "m3",
			name: "read_file",
			input: { path: "src/middleware/auth.ts" },
			status: "done",
			output: "187 lines",
			timestamp: T(19),
		},
		{
			kind: "tool",
			id: "m4",
			name: "read_file",
			input: { path: "package.json" },
			status: "done",
			output: "read",
			timestamp: T(18),
		},
		{
			kind: "assistant",
			id: "m5",
			text: "You're on `jsonwebtoken@8.5.1`. Here's my plan:\n\n1. Replace `jwt.sign` / `jwt.verify` with `jose` async equivalents\n2. Convert middleware to async/await\n3. Keep the same token shape — existing tokens stay valid",
			timestamp: T(18),
		},
		{
			kind: "tool",
			id: "m6",
			name: "edit_file",
			input: { path: "src/middleware/auth.ts" },
			status: "done",
			output: "+34 -28 lines",
			timestamp: T(17),
		},
		{
			kind: "tool",
			id: "m7",
			name: "edit_file",
			input: { path: "package.json" },
			status: "done",
			output: "jose@4.15.4 added",
			timestamp: T(17),
		},
		{
			kind: "assistant",
			id: "m8",
			text: "Done. Key changes:\n\n- `verifyToken` is now async — update call sites that weren't already awaiting it\n- Removed `jsonwebtoken`, added `jose@4.15.4`\n- Token shape unchanged — existing tokens continue to work",
			timestamp: T(14),
		},
	],
	s2: [
		{
			kind: "user",
			id: "m1",
			text: "There's a memory leak in the background worker. Process grows ~50MB every hour. Track it down and fix it.",
			timestamp: T(8),
		},
		{
			kind: "tool",
			id: "m2",
			name: "read_file",
			input: { path: "src/workers/background.ts" },
			status: "done",
			output: "312 lines",
			timestamp: T(7),
		},
		{
			kind: "tool",
			id: "m3",
			name: "list_directory",
			input: { path: "src/workers" },
			status: "done",
			output: "4 files",
			timestamp: T(7),
		},
		{
			kind: "tool",
			id: "m4",
			name: "read_file",
			input: { path: "src/workers/queue-processor.ts" },
			status: "done",
			output: "156 lines",
			timestamp: T(6),
		},
		{
			kind: "assistant",
			id: "m5",
			text: "Found it. In `background.ts` line 94, the `onMessage` listener is added inside `processQueue`, which runs every 30 seconds. Each call adds a new listener without removing the previous one — classic unbounded accumulation.\n\nFixing it now...",
			streaming: true,
			timestamp: T(1),
		},
	],
	s3: [
		{
			kind: "user",
			id: "m1",
			text: "Run the test suite and deploy to staging if everything passes.",
			timestamp: T(5),
		},
		{
			kind: "tool",
			id: "m2",
			name: "bash",
			input: { command: "bun run test" },
			status: "done",
			output: "247 passed · 14.2s",
			timestamp: T(4),
		},
		{
			kind: "assistant",
			id: "m3",
			text: "All 247 tests passed. Proceeding with staging deploy.",
			timestamp: T(3),
		},
		{
			kind: "approval",
			id: "m4",
			toolName: "bash",
			input: { command: "git push staging main" },
			resolved: false,
			timestamp: T(3),
		},
	],
	s4: [
		{
			kind: "user",
			id: "m1",
			text: "Add a full-text search feature to the product listing page.",
			timestamp: T(121),
		},
		{
			kind: "error",
			id: "m2",
			message:
				"Provider error: Codex returned 401 Unauthorized. Run `codex auth` to re-authenticate.",
			timestamp: T(120),
		},
	],
};

const TURNS: Record<string, TurnGroup[]> = {
	s1: [
		{
			id: "t1",
			index: 1,
			status: "done",
			durationMs: 2300,
			events: [
				{
					id: "e1",
					type: "user",
					summary: "message.userCreated",
					detail: "Refactor auth middleware to use jose...",
				},
				{
					id: "e2",
					type: "delta",
					summary: "message.assistantDelta",
					detail: "I'll start by reading...",
				},
				{
					id: "e3",
					type: "tool.done",
					summary: "tool.callStarted — read_file",
					detail: '{ "path": "src/middleware/auth.ts" }',
					status: "done",
				},
				{
					id: "e4",
					type: "tool.done",
					summary: "tool.callCompleted",
					detail: '{ "lines": 187, "isError": false }',
					status: "done",
				},
				{
					id: "e5",
					type: "tool.done",
					summary: "tool.callStarted — read_file",
					detail: '{ "path": "package.json" }',
					status: "done",
				},
				{
					id: "e6",
					type: "tool.done",
					summary: "tool.callCompleted",
					detail: '{ "isError": false }',
					status: "done",
				},
				{ id: "e7", type: "delta", summary: "message.assistantDelta" },
				{
					id: "e8",
					type: "tool.done",
					summary: "tool.callStarted — edit_file",
					detail: '{ "path": "src/middleware/auth.ts" }',
					status: "done",
				},
				{
					id: "e9",
					type: "tool.done",
					summary: "tool.callCompleted",
					detail: '{ "changes": "+34/-28 lines", "isError": false }',
					status: "done",
				},
				{
					id: "e10",
					type: "tool.done",
					summary: "tool.callStarted — edit_file",
					detail: '{ "path": "package.json" }',
					status: "done",
				},
				{ id: "e11", type: "completed", summary: "message.assistantCompleted", status: "done" },
				{ id: "e12", type: "turn.end", summary: "turn.completed", status: "done" },
			],
		},
	],
	s2: [
		{
			id: "t1",
			index: 1,
			status: "running",
			events: [
				{
					id: "e1",
					type: "user",
					summary: "message.userCreated",
					detail: "Find and fix memory leak...",
				},
				{
					id: "e2",
					type: "tool.done",
					summary: "tool.callStarted — read_file",
					detail: '{ "path": "src/workers/background.ts" }',
					status: "done",
				},
				{
					id: "e3",
					type: "tool.done",
					summary: "tool.callCompleted",
					detail: '{ "lines": 312, "isError": false }',
					status: "done",
				},
				{
					id: "e4",
					type: "tool.done",
					summary: "tool.callStarted — list_directory",
					detail: '{ "path": "src/workers" }',
					status: "done",
				},
				{
					id: "e5",
					type: "tool.done",
					summary: "tool.callCompleted",
					detail: '{ "count": 4 }',
					status: "done",
				},
				{
					id: "e6",
					type: "tool.done",
					summary: "tool.callStarted — read_file",
					detail: '{ "path": "src/workers/queue-processor.ts" }',
					status: "done",
				},
				{ id: "e7", type: "delta", summary: "message.assistantDelta", status: "running" },
			],
		},
	],
	s3: [
		{
			id: "t1",
			index: 1,
			status: "running",
			events: [
				{ id: "e1", type: "user", summary: "message.userCreated" },
				{
					id: "e2",
					type: "tool.done",
					summary: "tool.callStarted — bash",
					detail: '{ "command": "bun run test" }',
					status: "done",
				},
				{
					id: "e3",
					type: "tool.done",
					summary: "tool.callCompleted",
					detail: '{ "exitCode": 0, "passed": 247 }',
					status: "done",
				},
				{
					id: "e4",
					type: "approval",
					summary: "approval.requested — bash",
					detail: '{ "command": "git push staging main", "risk": "high" }',
					status: "pending",
				},
			],
		},
	],
	s4: [
		{
			id: "t1",
			index: 1,
			status: "failed",
			events: [
				{ id: "e1", type: "user", summary: "message.userCreated" },
				{
					id: "e2",
					type: "error",
					summary: "turn.failed",
					detail: "Provider error: 401 Unauthorized",
					status: "error",
				},
			],
		},
	],
};

// ─── Session runtime bridge ───────────────────────────────────────────────────

function SessionChat({
	session,
	messages,
	turns,
	showInspector,
	onApprove,
	onSend,
}: {
	session: MockSession;
	messages: ChatMessage[];
	turns: TurnGroup[];
	showInspector: boolean;
	onApprove: (id: string, approved: boolean) => void;
	onSend: (text: string) => void;
}) {
	const threadMessages = useMemo(() => convertToThreadMessages(messages), [messages]);

	const runtime = useExternalStoreRuntime({
		messages: threadMessages as ThreadMessageLike[],
		convertMessage: (msg: ThreadMessageLike) => msg,
		isRunning: session.status === "running",
		onNew: async (msg: AppendMessage) => {
			const first = msg.content[0];
			if (first && first.type === "text") {
				onSend(first.text);
			}
		},
	});

	return (
		<ApprovalContext.Provider value={{ onApprove }}>
			<AssistantRuntimeProvider runtime={runtime}>
				<div className="flex flex-1 overflow-hidden">
					<ChatThread session={session} />
					{showInspector && <EventInspector session={session} turns={turns} />}
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

	useEffect(() => {
		document.documentElement.classList.add("dark");
	}, []);

	const activeSession = sessions.find((s) => s.id === activeId) ?? null;
	const activeMessages = activeId ? (messages[activeId] ?? []) : [];
	const activeTurns = activeId ? (TURNS[activeId] ?? []) : [];

	const handleSend = (text: string) => {
		if (!activeId || !text.trim()) return;
		setMessages((prev) => ({
			...prev,
			[activeId]: [
				...(prev[activeId] ?? []),
				{ kind: "user", id: `msg-${Date.now()}`, text: text.trim(), timestamp: new Date() },
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
		const firstMessage: ChatMessage = {
			kind: "user",
			id: `msg-${Date.now()}`,
			text,
			timestamp: new Date(),
		};
		setSessions((prev) => [newSession, ...prev]);
		setMessages((prev) => ({ ...prev, [id]: [firstMessage] }));
		setActiveId(id);
	};

	return (
		<div className="flex flex-col h-full bg-background text-foreground overflow-hidden dark">
			<Titlebar
				showInspector={showInspector}
				onToggleInspector={() => setShowInspector((v) => !v)}
			/>
			<div className="flex flex-1 overflow-hidden">
				<SessionSidebar
					sessions={sessions}
					activeSessionId={activeId}
					onSelectSession={setActiveId}
					onNewSession={() => setActiveId(null)}
				/>
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
	);
}
