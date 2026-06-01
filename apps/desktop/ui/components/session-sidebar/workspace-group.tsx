import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { FolderSimple, FolderOpenIcon, CaretRightIcon } from "@phosphor-icons/react";
import { IconEdit } from "@tabler/icons-react";
import type { Session } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { SessionItem } from "./session-item";

type WorkspaceGroupProps = {
	name: string;
	workspaceId: string;
	sessions: Session[];
	activeSessionId: string | null;
	onSelect: (id: string | null) => void;
	onCreateWorkspaceSession: (workspaceId: string) => void;
	defaultOpen?: boolean;
};

export function WorkspaceGroup({
	name,
	workspaceId,
	sessions,
	activeSessionId,
	onSelect,
	onCreateWorkspaceSession,
	defaultOpen,
}: WorkspaceGroupProps) {
	const [open, setOpen] = useState(defaultOpen ?? false);
	const [sessionListRef] = useAutoAnimate<HTMLDivElement>();
	const hasActive = sessions.some((s) => s.id === activeSessionId);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<div className="flex items-center gap-1 px-2 py-1 rounded-lg group">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className={cn(
							"flex flex-1 items-center gap-1.5 min-w-0 text-left transition-colors",
							hasActive ? "text-white/65" : "text-white/38 hover:text-white/58",
						)}
					>
						<CaretRightIcon
							size={10}
							weight="bold"
							className={cn("shrink-0 transition-transform text-white/22", open && "rotate-90")}
						/>
						{open ? (
							<FolderOpenIcon size={14} weight="fill" className="shrink-0 text-white/40" />
						) : (
							<FolderSimple size={14} weight="regular" className="shrink-0 text-white/28" />
						)}
						<span className="text-xs font-medium truncate">{name}</span>
					</button>
				</CollapsibleTrigger>
				<button
					type="button"
					aria-label={`Create new chat in ${name}`}
					onClick={() => onCreateWorkspaceSession(workspaceId)}
					className="shrink-0 rounded-sm p-0.5 text-white/28 opacity-0 transition-opacity transition-colors hover:text-white/70 hover:bg-white/[6%] hover:rounded-sm group-hover:opacity-100"
				>
					<IconEdit stroke={2} size={12} />
				</button>
			</div>
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
