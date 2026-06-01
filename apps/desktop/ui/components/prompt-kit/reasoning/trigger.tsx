import { Brain, CaretDown } from "@phosphor-icons/react";
import { CollapsibleTrigger } from "../../ui/collapsible";
import { cn } from "../../../lib/utils";
import { useReasoningCtx } from "./context";

type ReasoningTriggerProps = {
	children?: React.ReactNode;
	isStreaming?: boolean;
	durationMs?: number;
	className?: string;
};

export function ReasoningTrigger({
	children,
	isStreaming,
	durationMs,
	className,
}: ReasoningTriggerProps) {
	const { open } = useReasoningCtx();

	return (
		<CollapsibleTrigger asChild>
			<button
				className={cn(
					"flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/55 transition-colors",
					className,
				)}
			>
				<Brain
					size={13}
					weight="light"
					className={cn(isStreaming && "text-white/55 animate-pulse")}
				/>
				<span>{children ?? (isStreaming ? "Thinking…" : "View reasoning")}</span>
				{durationMs != null && (
					<span className="text-white/22">({(durationMs / 1000).toFixed(1)}s)</span>
				)}
				<CaretDown
					size={11}
					weight="bold"
					className={cn("ml-1 transition-transform duration-200", open && "rotate-180")}
				/>
			</button>
		</CollapsibleTrigger>
	);
}
