import { useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { Provider } from "./lib/types";
import { Titlebar } from "./components/titlebar";
import { SessionSidebar } from "./components/session-sidebar";
import { SessionChat } from "./components/session-chat";
import { NewChat } from "./components/new-chat";
import { useSessions } from "./hooks/use-sessions";
import { useProviders } from "./hooks/use-providers";

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
