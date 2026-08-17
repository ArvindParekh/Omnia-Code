import { useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { Provider } from "./lib/types";
import { Titlebar } from "./components/titlebar";
import { SessionSidebar } from "./components/session-sidebar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";
import { SessionChat } from "./components/session-chat";
import { NewChat } from "./components/new-chat";
import { CommandPalette } from "./components/command-palette";
import { Toaster } from "sonner";
import { useSessions } from "./hooks/use-sessions";
import { usePanelLayout } from "./hooks/use-panel-layout";
import { useProviders } from "./hooks/use-providers";

export default function App() {
	const { sessions, createSession, renameSession, deleteSession } = useSessions();
	const { providers } = useProviders();
	const [activeId, setActiveId] = useState<string | null>(null);
	const [showInspector, setShowInspector] = useState(true);
	const [isDark, setIsDark] = useState(true);
	const shellLayout = usePanelLayout("shell");
	const [paletteOpen, setPaletteOpen] = useState(false);

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

	useEffect(() => {
		if (activeId && !sessions.some((s) => s.id === activeId)) setActiveId(null);
	}, [sessions, activeId]);

	const handleNewSession = async (text: string, provider: Provider, workspacePath: string) => {
		const session = await createSession(provider, workspacePath);
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
			<ResizablePanelGroup
				orientation="horizontal"
				{...shellLayout}
				className="flex-1 overflow-hidden"
			>
				<ResizablePanel
					id="sidebar"
					defaultSize="18%"
					minSize="14%"
					maxSize="34%"
					style={{ overflow: "hidden" }}
				>
					<SessionSidebar
						sessions={sessions}
						activeSessionId={activeId}
						onSelectSession={setActiveId}
						onOpenSearch={() => setPaletteOpen(true)}
						onCreateWorkspaceSession={handleCreateWorkspaceSession}
						onRenameSession={renameSession}
						onDeleteSession={deleteSession}
					/>
				</ResizablePanel>

				<ResizableHandle />

				<ResizablePanel id="content" minSize="40%" style={{ overflow: "hidden" }}>
					<div ref={contentRef} className="flex h-full overflow-hidden">
						{activeSession ? (
							<SessionChat
								key={activeId}
								session={activeSession}
								showInspector={showInspector}
								initialMessage={activeId ? sessionInitials[activeId] : undefined}
								onInitialMessageSent={() =>
									setSessionInitials((prev) => {
										const next = { ...prev };
										if (activeId) delete next[activeId];
										return next;
									})
								}
							/>
						) : (
							<NewChat onStart={handleNewSession} recentSessions={sessions} providers={providers} />
						)}
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>

			<CommandPalette
				open={paletteOpen}
				onOpenChange={setPaletteOpen}
				sessions={sessions}
				onSelectSession={setActiveId}
				onToggleInspector={() => setShowInspector((v) => !v)}
				onToggleTheme={() => setIsDark((v) => !v)}
				isDark={isDark}
			/>

			<Toaster
				theme="dark"
				position="bottom-right"
				toastOptions={{
					classNames: {
						toast:
							"!bg-[var(--surface-raised)] !border-white/[9%] !rounded-lg !py-2.5 !px-3 !gap-2",
						title: "!text-[10.5px] !font-normal !text-white/62",
						description: "!text-[10px] !font-normal !text-white/35 !mt-0.5",
						icon: "!w-3 !h-3 [&>svg]:!w-3 [&>svg]:!h-3",
					},
				}}
			/>
		</div>
	);
}
