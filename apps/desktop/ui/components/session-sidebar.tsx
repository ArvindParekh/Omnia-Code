import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
	MagnifyingGlass,
	PlusCircle,
	FolderSimple,
	FolderOpenIcon,
	CaretRightIcon,
	GearSix,
	ChatTeardropText,
} from "@phosphor-icons/react";
import type { MockSession } from "../lib/types";
import { providerLabel } from "../lib/provider";
import { timeAgo } from "../lib/time";
import { cn } from "../lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

type SessionSidebarProps = {
	sessions: MockSession[];
	activeSessionId: string | null;
	onSelectSession: (id: string | null) => void;
	onNewSession?: () => void;
};

export function SessionSidebar({
	sessions,
	activeSessionId,
	onSelectSession,
}: SessionSidebarProps) {
	const [query, setQuery] = useState("");
	const [listRef] = useAutoAnimate<HTMLDivElement>();

	const filtered = query
		? sessions.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
		: sessions;

	const workspaces = Array.from(new Set(sessions.map((s) => s.workspacePath)));

	return (
		<div className="flex flex-col w-[240px] shrink-0 overflow-hidden">
			{/* Top actions */}
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

			{/* Search input */}
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

			{/* Session list */}
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
						{/* Projects section header */}
						<div className="flex items-center justify-between px-2 pb-1">
							<span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/22">
								Projects
							</span>
						</div>

						{/* Workspace groups */}
						{workspaces.map((ws) => {
							const wsSessions = sessions.filter((s) => s.workspacePath === ws);
							const wsBase = ws.replace(/^.*\//, "");
							return (
								<WorkspaceGroup
									key={ws}
									name={wsBase}
									sessions={wsSessions}
									activeSessionId={activeSessionId}
									onSelect={onSelectSession}
									defaultOpen
								/>
							);
						})}
					</div>
				)}
			</div>

			{/* Bottom */}
			<div className="px-3 py-3 border-t border-white/[6%] flex items-center">
				<button className="flex items-center gap-2 text-[12px] text-white/28 hover:text-white/50 transition-colors">
					<GearSix size={14} weight="light" />
					Settings
				</button>
			</div>
		</div>
	);
}

function WorkspaceGroup({
	name,
	sessions,
	activeSessionId,
	onSelect,
	defaultOpen,
}: {
	name: string;
	sessions: MockSession[];
	activeSessionId: string | null;
	onSelect: (id: string | null) => void;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen ?? false);
	const [sessionListRef] = useAutoAnimate<HTMLDivElement>();
	const hasActive = sessions.some((s) => s.id === activeSessionId);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger asChild>
				<button
					className={cn(
						"flex items-center gap-1.5 w-full px-2 py-1 rounded-lg text-left transition-colors group",
						hasActive ? "text-white/65" : "text-white/38 hover:text-white/58 hover:bg-white/[3%]",
					)}
				>
					<CaretRightIcon
						size={10}
						weight="bold"
						className={cn("shrink-0 transition-transform text-white/22", open && "rotate-90")}
					/>
					{open ? (
						<FolderOpenIcon size={14} weight="fill" className={cn("shrink-0", "text-white/40")} />
					) : (
						<FolderSimple size={14} weight="regular" className={cn("shrink-0", "text-white/28")} />
					)}
					<span className="text-xs font-medium truncate">{name}</span>
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div
					ref={sessionListRef}
					className="flex flex-col gap-px ml-3 pl-3 border-l border-white/[6%] mb-1"
				>
					{sessions.map((s) => (
						<SessionItem
							key={s.id}
							session={s}
							isActive={s.id === activeSessionId}
							onClick={() => onSelect(s.id)}
							indented
						/>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

function SessionItem({
	session,
	isActive,
	onClick,
	indented,
}: {
	session: MockSession;
	isActive: boolean;
	onClick: () => void;
	indented: boolean;
}) {
	const label = providerLabel(session.provider);

	return (
		<button
			onClick={onClick}
			className={cn(
				"w-full text-left rounded-sm px-2.5 py-0.5 my-0.5 transition-colors group",
				isActive ? "bg-white/[7%]" : "hover:bg-white/[4%]",
				indented && "text-[12px]",
			)}
		>
			<div className="flex items-center gap-1.5 min-w-0">
				<StatusDot status={session.status} />
				<span
					className={cn(
						"truncate min-w-0 leading-[1.4] transition-colors font-medium",
						indented ? "text-[12px]" : "text-[13px]",
						isActive ? "text-white/85" : "text-white/50 group-hover:text-white/70",
					)}
				>
					{session.title}
				</span>
				<span className="ml-auto text-[10px] text-white/18 shrink-0 tabular-nums">
					{timeAgo(session.updatedAt)}
				</span>
			</div>
			{!indented && (
				<div className="flex items-center gap-1 mt-0.5 pl-[13px]">
					<ChatTeardropText size={10} weight="light" className="text-white/18 shrink-0" />
					<span className="text-[11px] text-white/22 truncate">{label}</span>
				</div>
			)}
		</button>
	);
}

function StatusDot({ status }: { status: MockSession["status"] }) {
	if (status === "running") {
		return <span className="w-[5px] h-[5px] rounded-full bg-white/35 shrink-0 status-running" />;
	}
	if (status === "error") {
		return <span className="w-[5px] h-[5px] rounded-full bg-red-400/55 shrink-0" />;
	}
	return <span className="w-[5px] h-[5px] rounded-full bg-transparent shrink-0" />;
}
