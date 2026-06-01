import { ChatTeardropText } from "@phosphor-icons/react";
import type { Session } from "../../lib/types";
import { providerLabel } from "../../lib/provider";
import { timeAgo } from "../../lib/time";
import { cn } from "../../lib/utils";

function StatusDot({ status }: { status: Session["status"] }) {
	if (status === "running") {
		return <span className="w-[5px] h-[5px] rounded-full bg-white/35 shrink-0 status-running" />;
	}
	if (status === "error") {
		return <span className="w-[5px] h-[5px] rounded-full bg-red-400/55 shrink-0" />;
	}
	return <span className="w-[5px] h-[5px] rounded-full bg-transparent shrink-0" />;
}

export function SessionItem({
	session,
	isActive,
	onClick,
	indented,
}: {
	session: Session;
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
