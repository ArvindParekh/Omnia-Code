import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { MagnifyingGlass, PlusCircle, GearSix } from "@phosphor-icons/react";
import type { Session } from "../../lib/types";
import { cn } from "../../lib/utils";
import { WorkspaceGroup } from "./workspace-group";
import { SessionItem } from "./session-item";

type SessionSidebarProps = {
	sessions: Session[];
	activeSessionId: string | null;
	onSelectSession: (id: string | null) => void;
	onCreateWorkspaceSession: (workspaceId: string) => void;
};

export function SessionSidebar({
	sessions,
	activeSessionId,
	onSelectSession,
	onCreateWorkspaceSession,
}: SessionSidebarProps) {
	const [query, setQuery] = useState("");
	const [listRef] = useAutoAnimate<HTMLDivElement>();

	const filtered = query
		? sessions.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
		: sessions;

	const workspaces = Array.from(new Set(sessions.map((s) => s.workspaceId)));

	return (
		<div className="flex flex-col w-[240px] shrink-0 overflow-hidden">
			<div className="px-3 pt-3 pb-2 flex flex-col gap-0.5">
				<button
					onClick={() => onSelectSession(null)}
					className={cn(
						"flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-left transition-colors group",
						activeSessionId === null
							? "bg-white/[7%] text-white/80"
							: "text-white/45 hover:text-white/70 hover:bg-white/[4%]",
					)}
				>
					<PlusCircle
						size={15}
						weight="light"
						className={cn(
							"shrink-0 transition-colors",
							activeSessionId === null
								? "text-white/60"
								: "text-white/35 group-hover:text-white/55",
						)}
					/>
					<span className="text-[13px] font-medium">New chat</span>
				</button>

				<button className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/40 hover:text-white/65 hover:bg-white/[4%] transition-colors w-full text-left">
					<MagnifyingGlass size={15} weight="light" className="shrink-0" />
					<span className="text-[13px]">Search</span>
				</button>
			</div>

			<div className="px-3 pb-2">
				<div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[4%] border border-transparent focus-within:border-white/[10%] transition-colors">
					<MagnifyingGlass size={12} weight="light" className="text-white/25 shrink-0" />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search sessions..."
						className="flex-1 bg-transparent text-[12px] text-white/60 outline-none placeholder:text-white/22 min-w-0 select-text"
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto px-2 pb-2">
				{query ? (
					<div ref={listRef} className="flex flex-col gap-px">
						{filtered.length === 0 ? (
							<p className="text-[12px] text-white/25 px-2 py-3 text-center">No results</p>
						) : (
							filtered.map((s) => (
								<SessionItem
									key={s.id}
									session={s}
									isActive={s.id === activeSessionId}
									onClick={() => onSelectSession(s.id)}
									indented={false}
								/>
							))
						)}
					</div>
				) : (
					<div ref={listRef} className="flex flex-col gap-1 pt-1">
						<div className="flex items-center justify-between px-2 pb-1">
							<span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/22">
								Projects
							</span>
						</div>

						{workspaces.map((ws) => {
							const wsSessions = sessions.filter((s) => s.workspaceId === ws);
							const wsName = ws.replace(/^.*\//, "") || ws;
							return (
								<WorkspaceGroup
									key={ws}
									name={wsName}
									workspaceId={ws}
									sessions={wsSessions}
									activeSessionId={activeSessionId}
									onSelect={onSelectSession}
									onCreateWorkspaceSession={onCreateWorkspaceSession}
									defaultOpen
								/>
							);
						})}
					</div>
				)}
			</div>

			<div className="px-3 py-3 border-t border-white/[6%] flex items-center">
				<button className="flex items-center gap-2 text-[12px] text-white/28 hover:text-white/50 transition-colors">
					<GearSix size={14} weight="light" />
					Settings
				</button>
			</div>
		</div>
	);
}
