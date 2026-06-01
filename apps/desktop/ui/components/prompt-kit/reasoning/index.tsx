import { useState } from "react";
import { Collapsible } from "../../ui/collapsible";
import { cn } from "../../../lib/utils";
import { ReasoningCtx } from "./context";

export { ReasoningTrigger } from "./trigger";
export { ReasoningContent } from "./content";

type ReasoningProps = {
	children: React.ReactNode;
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	isStreaming?: boolean;
	className?: string;
};

export function Reasoning({
	children,
	defaultOpen = false,
	open: controlledOpen,
	onOpenChange,
	isStreaming = false,
	className,
}: ReasoningProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
	const [prevIsStreaming, setPrevIsStreaming] = useState(isStreaming);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen! : uncontrolledOpen;

	const setOpen = (v: boolean) => {
		if (!isControlled) setUncontrolledOpen(v);
		onOpenChange?.(v);
	};

	// Derived-state pattern: auto-open when streaming starts, keep open after it ends.
	// React re-renders immediately when setState is called during render (no commit).
	if (isStreaming && !prevIsStreaming) {
		setPrevIsStreaming(true);
		if (!isControlled && !uncontrolledOpen) setUncontrolledOpen(true);
	} else if (!isStreaming && prevIsStreaming) {
		setPrevIsStreaming(false);
		// intentionally don't auto-close — let the user keep it open
	}

	return (
		<ReasoningCtx.Provider value={{ open, setOpen }}>
			<Collapsible
				open={open}
				onOpenChange={setOpen}
				className={cn("flex flex-col gap-1", className)}
			>
				{children}
			</Collapsible>
		</ReasoningCtx.Provider>
	);
}
