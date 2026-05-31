import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { MockSession } from "../App";
import { providerLabel } from "../lib/provider";
import { timeAgo } from "../lib/time";

type SessionSidebarProps = {
	sessions: MockSession[];
	activeSessionId: string | null;
	onSelectSession: (id: string) => void;
	onNewSession: () => void;
};

export function SessionSidebar({
	sessions,
	activeSessionId,
	onSelectSession,
	onNewSession,
}: SessionSidebarProps) {
	const [query, setQuery] = useState("");

	const filtered = query
		? sessions.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
		: sessions;

	return (
		<div className="flex flex-col w-[240px] shrink-0 border-r border-white/[6%] overflow-hidden">
			{/* Top nav actions */}
			<div className="px-3 pt-3 pb-2 flex flex-col gap-0.5">
				<button
					onClick={onNewSession}
					className="flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-left
						text-white/40 hover:text-white/65 hover:bg-white/[4%] transition-colors"
				>
					<span className="text-[13px]">New session</span>
				</button>

				<div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-white/35 hover:bg-white/[4%] transition-colors">
					<MagnifyingGlass size={13} className="shrink-0" />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search"
						className="flex-1 bg-transparent text-[13px] text-white/60 outline-none placeholder:text-white/28 min-w-0"
						style={{ userSelect: "text" }}
					/>
				</div>
			</div>

			{/* Section label */}
			<div className="px-4 pt-2 pb-1">
				<span className="text-[10px] font-medium text-white/22 uppercase tracking-[0.09em]">
					Sessions
				</span>
			</div>

			{/* Session list */}
			<div className="flex-1 overflow-y-auto px-2 pb-2">
				<div className="flex flex-col gap-px">
					{filtered.map((session) => (
						<SessionItem
							key={session.id}
							session={session}
							isActive={session.id === activeSessionId}
							onClick={() => onSelectSession(session.id)}
						/>
					))}
				</div>
			</div>

			{/* Bottom */}
			<div className="px-4 py-3 border-t border-white/[6%]">
				<span className="text-[11px] text-white/20">Settings</span>
			</div>
		</div>
	);
}

function SessionItem({
	session,
	isActive,
	onClick,
}: {
	session: MockSession;
	isActive: boolean;
	onClick: () => void;
}) {
	const label = providerLabel(session.provider);
	const workspace = session.workspacePath.replace(/^.*\//, "");

	return (
		<button
			onClick={onClick}
			className={`w-full text-left rounded-[5px] px-2.5 py-[7px] transition-colors group
				${isActive ? "bg-white/[7%]" : "hover:bg-white/[4%]"}`}
		>
			{/* Title row */}
			<div className="flex items-center gap-1.5 min-w-0">
				{session.status === "running" && (
					<span className="w-[5px] h-[5px] rounded-full bg-white/28 shrink-0 status-running" />
				)}
				<span
					className={`text-[13px] truncate min-w-0 leading-[1.4] transition-colors
						${isActive ? "text-white/88" : "text-white/55 group-hover:text-white/72"}`}
				>
					{session.title}
				</span>
			</div>

			{/* Meta row */}
			<div className="flex items-center gap-1 mt-px min-w-0 pl-[13px]">
				<span className="text-[11px] text-white/22 truncate flex-1 font-normal">
					{label} &middot; {workspace}
				</span>
				<span className="text-[10px] text-white/18 shrink-0 tabular-nums">
					{timeAgo(session.updatedAt)}
				</span>
			</div>
		</button>
	);
}
