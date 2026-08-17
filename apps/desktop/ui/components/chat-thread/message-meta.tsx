import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function MessageMeta({
	timestamp,
	detail,
	align,
	children,
}: {
	timestamp: string;
	detail?: string | null;
	align: "start" | "end";
	children?: ReactNode;
}) {
	const stamp = (
		<span className="text-[9px] tabular-nums text-white/22 shrink-0">
			{timestamp}
			{detail && <span className="text-white/15"> · {detail}</span>}
		</span>
	);

	return (
		<div
			className={cn(
				"flex h-[22px] items-center gap-1",
				align === "end" ? "justify-end" : "justify-start",
			)}
		>
			{align === "start" && stamp}
			<div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
				{children}
			</div>
			{align === "end" && stamp}
		</div>
	);
}
