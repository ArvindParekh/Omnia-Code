import { useState, useEffect, createContext, useContext } from "react";
import { Brain, CaretDown } from "@phosphor-icons/react";
import { cn } from "../../lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

// ─── Context ──────────────────────────────────────────────────────────────────

type ReasoningCtxValue = { open: boolean; setOpen: (v: boolean) => void };
const ReasoningCtx = createContext<ReasoningCtxValue | null>(null);

function useReasoningCtx() {
	const ctx = useContext(ReasoningCtx);
	if (!ctx) throw new Error("Must be inside <Reasoning>");
	return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

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
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen! : uncontrolledOpen;

	const setOpen = (v: boolean) => {
		if (!isControlled) setUncontrolledOpen(v);
		onOpenChange?.(v);
	};

	// Auto-open while streaming, auto-close when streaming ends
	useEffect(() => {
		if (isStreaming) setOpen(true);
		// intentionally don't auto-close so user can keep it open after
	}, [isStreaming]);

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

// ─── Trigger ──────────────────────────────────────────────────────────────────

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

// ─── Content ──────────────────────────────────────────────────────────────────

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
					// fade-in on open
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
