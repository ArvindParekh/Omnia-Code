import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import type { InspectorEvent } from "../../lib/types";
import { cn } from "../../lib/utils";
import { ToolEventDetail } from "./tool-event-detail";

function getEventOpacity(type: string, status?: InspectorEvent["status"]): number {
	if (type === "error" || status === "error") return 0.5;
	if (type === "approval" || status === "pending") return 0.55;
	if (status === "running") return 0.5;
	if (type === "user") return 0.55;
	if (type === "reasoning") return 0.26;
	return 0.36;
}

export function EventRow({ event, isLast }: { event: InspectorEvent; isLast: boolean }) {
	const [expanded, setExpanded] = useState(false);
	const opacity = getEventOpacity(event.type, event.status);
	const isTool = event.type === "tool";
	const isExpandable = isTool || Boolean(event.detail);

	return (
		<div>
			<button
				onClick={() => isExpandable && setExpanded((v) => !v)}
				className={cn(
					"w-full flex items-center gap-2 pl-8 pr-4 py-[3px] transition-colors text-left",
					isExpandable ? "hover:bg-white/[3%] cursor-pointer" : "cursor-default",
				)}
			>
				<span className="shrink-0 w-3 flex flex-col items-center relative" aria-hidden="true">
					{!isLast && (
						<span className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-white/[5%]" />
					)}
					<span className="w-[5px] h-[5px] rounded-full bg-white/[12%] relative z-10 mt-[5px]" />
				</span>

				<span
					className="text-[11px] font-mono truncate flex-1 min-w-0 text-foreground"
					style={{ opacity }}
				>
					{event.summary}
				</span>

				{isExpandable && (
					<CaretRight
						size={8}
						weight="bold"
						className={cn("text-white/18 transition-transform shrink-0", expanded && "rotate-90")}
					/>
				)}
			</button>

			{expanded && isTool && (
				<div className="pl-14 pr-4 py-1.5">
					<ToolEventDetail event={event} />
				</div>
			)}

			{expanded && !isTool && event.detail && (
				<div className="pl-14 pr-4 py-1.5">
					<code className="block text-[10px] font-mono text-white/22 leading-relaxed whitespace-pre-wrap break-all select-text">
						{event.detail}
					</code>
				</div>
			)}
		</div>
	);
}
