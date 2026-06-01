import { CollapsibleContent } from "../../ui/collapsible";
import { cn } from "../../../lib/utils";

type ReasoningContentProps = {
	children: React.ReactNode;
	className?: string;
};

export function ReasoningContent({ children, className }: ReasoningContentProps) {
	return (
		<CollapsibleContent>
			<div
				className={cn(
					"mt-1.5 pl-3.5 border-l border-white/[8%] text-[12px] text-white/38 font-mono",
					"leading-relaxed select-text whitespace-pre-wrap",
					"data-[state=open]:animate-in data-[state=open]:fade-in-0",
					"data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
					className,
				)}
			>
				{children}
			</div>
		</CollapsibleContent>
	);
}
