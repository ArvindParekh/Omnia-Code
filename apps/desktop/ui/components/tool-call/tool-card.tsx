import { CaretRight, SpinnerGap, Warning } from "@phosphor-icons/react";
import { type ReactNode, useState } from "react";
import { cn } from "../../lib/utils";
import { GateHeader, useGate } from "./gate";

export type ToolStatus = "running" | "done" | "error";

type ToolCardProps = {
	icon: ReactNode;
	title: ReactNode;
	meta?: ReactNode;
	status: ToolStatus;
	children?: ReactNode;
	defaultOpen?: boolean;
};

export function ToolCard({
	icon,
	title,
	meta,
	status,
	children,
	defaultOpen = false,
}: ToolCardProps) {
	const [open, setOpen] = useState(defaultOpen);
	const collapsible = children != null;
	const gate = useGate();

	const header = (
		<>
			<div className="flex items-center gap-2 min-w-0">
				{collapsible ? (
					<CaretRight
						size={10}
						weight="bold"
						className={cn("text-white/25 shrink-0 transition-transform", open && "rotate-90")}
					/>
				) : (
					<span className="w-[10px] shrink-0" />
				)}
				{icon}
				<div className="min-w-0 truncate">{title}</div>
			</div>
			<div className="flex items-center gap-2 shrink-0 pl-2">
				{meta}
				{status === "running" && (
					<SpinnerGap size={10} weight="bold" className="text-white/25 animate-spin" />
				)}
				{status === "error" && <Warning size={10} weight="fill" className="text-[var(--warn)]" />}
			</div>
		</>
	);

	return (
		<div
			className={cn(
				"rounded-xl border overflow-hidden text-[11px]",
				status === "error"
					? "border-[var(--warn)]/25 bg-[var(--warn)]/[3%]"
					: gate
						? "border-[var(--warn-border)] bg-white/[2%]"
						: "border-white/[8%] bg-white/[2%]",
			)}
		>
			{gate && <GateHeader gate={gate} />}
			{collapsible ? (
				<button
					type="button"
					onClick={() => setOpen((value) => !value)}
					className={cn(
						"w-full flex items-center justify-between px-3.5 py-2 text-left",
						"hover:bg-white/[2%] transition-colors",
						open && "border-b border-white/[5%]",
					)}
				>
					{header}
				</button>
			) : (
				<div className="flex items-center justify-between px-3.5 py-2">{header}</div>
			)}

			{collapsible && open && children}
		</div>
	);
}
