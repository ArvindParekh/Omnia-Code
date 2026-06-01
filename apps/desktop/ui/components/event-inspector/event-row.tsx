import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import type { InspectorEvent } from "../../lib/types";
import { cn } from "../../lib/utils";

function getEventOpacity(type: string, status?: InspectorEvent["status"]): number {
	if (type === "error" || status === "error") return 0.45;
	if (type === "approval" || status === "pending") return 0.5;
	if (status === "running") return 0.45;
	if (type === "turn.end") return 0.32;
	if (type === "user") return 0.5;
	return 0.3;
}

export function EventRow({ event, isLast }: { event: InspectorEvent; isLast: boolean }) {
	const [expanded, setExpanded] = useState(false);
	const opacity = getEventOpacity(event.type, event.status);

	return (
		<div>
			<button
				onClick={() => event.detail && setExpanded((v) => !v)}
				className={cn(
					"w-full flex items-center gap-2 pl-8 pr-4 py-[3px] transition-colors text-left",
					event.detail ? "hover:bg-white/[3%] cursor-pointer" : "cursor-default",
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

				{event.detail && (
					<CaretRight
						size={8}
						weight="bold"
						className={cn("text-white/18 transition-transform shrink-0", expanded && "rotate-90")}
					/>
				)}
			</button>

			{expanded && event.detail && (
				<div className="pl-14 pr-4 py-1.5">
					<code className="block text-[10px] font-mono text-white/22 leading-relaxed whitespace-pre-wrap break-all select-text">
						{event.detail}
					</code>
				</div>
			)}
		</div>
	);
}
