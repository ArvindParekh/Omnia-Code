import {
	ActionBarPrimitive,
	BranchPickerPrimitive,
	ComposerPrimitive,
	MessagePrimitive,
	SelectionToolbarPrimitive,
	ThreadPrimitive,
	useMessage,
	useThreadRuntime,
} from "@assistant-ui/react";
import type { ReasoningMessagePartProps, TextMessagePartProps } from "@assistant-ui/react";
import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
	ArrowUp,
	X,
	FolderSimple,
	SpinnerGap,
	ArrowDown,
	Copy,
	Check,
	ArrowClockwise,
	Paperclip,
	Quotes,
	CaretLeft,
	CaretRight,
} from "@phosphor-icons/react";
import type { Session, Provider } from "../lib/types";
import { providerLabel } from "../lib/provider";
import { cn } from "../lib/utils";
import { ToolCallBlock } from "./tool-call-block";
import { MarkdownText } from "./assistant-ui/markdown-text";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "./prompt-kit/reasoning";
import { copyText } from "../lib/clipboard";

// ─── Thread shell ─────────────────────────────────────────────────────────────

export function ChatThread({ session }: { session: Session }) {
	const label = providerLabel(session.provider);
	const workspaceBase = session.workspaceId.replace(/^.*\//, "") || session.workspaceId;
	const [messagesRef] = useAutoAnimate<HTMLDivElement>();

	return (
		<ThreadPrimitive.Root className="flex flex-col flex-1 overflow-hidden">
			{/* Session header */}
			<div className="flex items-center gap-3 px-5 py-3 border-b border-white/[6%] shrink-0">
				<span className="text-[13px] font-medium text-white/80 truncate">{session.title}</span>
				<span className="text-[11px] text-white/25 shrink-0 hidden sm:block">
					{label} &middot; {workspaceBase}
				</span>
				{session.status === "running" && (
					<SpinnerGap
						size={13}
						weight="bold"
						className="ml-auto text-white/30 animate-spin shrink-0"
					/>
				)}
				{session.status === "error" && (
					<span className="ml-auto text-[11px] text-red-400/50 shrink-0">failed</span>
				)}
			</div>

			{/* Viewport — messages + sticky composer */}
			<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
				<div className="flex flex-col min-h-full">
					<ThreadPrimitive.Empty>
						<div className="flex flex-col items-center justify-center flex-1 gap-2 py-20">
							<p className="text-[13px] text-white/25">Ask {label} anything</p>
						</div>
					</ThreadPrimitive.Empty>

					<div
						ref={messagesRef}
						className="flex flex-col px-5 py-6 gap-7 max-w-[700px] mx-auto w-full"
					>
						<ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
					</div>

					{/* Sticky footer — scroll button + composer */}
					<ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto bg-[var(--background)]">
						<div className="max-w-[700px] mx-auto w-full px-5 pb-5 pt-2 relative">
							<ThreadPrimitive.ScrollToBottom asChild>
								<button
									className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5
										px-3 py-1.5 rounded-full bg-[var(--surface)] border border-white/[10%]
										text-[11px] text-white/45 hover:text-white/65 hover:bg-[var(--surface-raised)]
										transition-all shadow-lg
										data-[visible=false]:opacity-0 data-[visible=false]:pointer-events-none"
								>
									<ArrowDown size={11} weight="bold" />
									Latest
								</button>
							</ThreadPrimitive.ScrollToBottom>

							<Composer
								label={label}
								workspaceId={session.workspaceId}
								provider={session.provider}
							/>
						</div>
					</ThreadPrimitive.ViewportFooter>
				</div>
			</ThreadPrimitive.Viewport>

			{/* Selection toolbar — must be inside Root but outside Viewport */}
			<SelectionToolbarPrimitive.Root className="z-50 flex items-center gap-1 rounded-lg border border-white/[10%] bg-[var(--surface-raised)] px-2 py-1.5 shadow-xl">
				<SelectionToolbarPrimitive.Quote asChild>
					<button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-white/50 hover:text-white/75 hover:bg-white/[5%] transition-colors">
						<Quotes size={12} weight="light" />
						Quote
					</button>
				</SelectionToolbarPrimitive.Quote>
			</SelectionToolbarPrimitive.Root>
		</ThreadPrimitive.Root>
	);
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
	label,
	workspaceId,
	provider,
}: {
	label: string;
	workspaceId: string;
	provider: Provider;
}) {
	const threadRuntime = useThreadRuntime();
	const isRunning = threadRuntime.getState().isRunning;
	const workspaceBase = workspaceId.replace(/^.*\//, "") || workspaceId;

	return (
		<ComposerPrimitive.Root
			className="rounded-2xl border border-white/[9%] bg-white/[3%] overflow-hidden
				focus-within:border-white/[16%] focus-within:bg-white/[4%] transition-all"
		>
			{/* Quote preview — only renders when a quote is set */}
			<ComposerPrimitive.Quote className="flex items-start gap-2 px-4 pt-3 pb-0">
				<div className="flex-1 flex items-start gap-2 rounded-lg border border-white/[8%] bg-white/[3%] px-3 py-2">
					<Quotes size={11} weight="fill" className="text-white/30 shrink-0 mt-0.5" />
					<ComposerPrimitive.QuoteText className="flex-1 text-[12px] text-white/45 font-mono leading-relaxed line-clamp-2" />
				</div>
				<ComposerPrimitive.QuoteDismiss asChild>
					<button className="mt-2 p-0.5 text-white/30 hover:text-white/55 transition-colors shrink-0">
						<X size={11} weight="bold" />
					</button>
				</ComposerPrimitive.QuoteDismiss>
			</ComposerPrimitive.Quote>

			{/* Attachment chips — rendered in a flex-wrap row, hidden when empty */}
			<div className="flex flex-wrap gap-1.5 px-4 pt-2 empty:hidden">
				<ComposerPrimitive.Attachments>
					{({ attachment }) => (
						<div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/[8%] bg-white/[3%] text-[11px] text-white/45">
							<Paperclip size={10} weight="light" />
							<span className="max-w-[120px] truncate">{attachment.name}</span>
						</div>
					)}
				</ComposerPrimitive.Attachments>
			</div>

			{/* Textarea */}
			<div className="px-4 pt-3.5 pb-2">
				<ComposerPrimitive.Input
					placeholder={`Ask ${label}...`}
					rows={1}
					className="w-full bg-transparent text-[13px] text-white/80 placeholder:text-white/25
						resize-none outline-none leading-[1.6] select-text"
				/>
			</div>

			{/* Action bar */}
			<div className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-white/[5%]">
				{/* Attachment button */}
				<ComposerPrimitive.AddAttachment asChild>
					<button className="p-1.5 rounded-lg text-white/28 hover:text-white/55 hover:bg-white/[5%] transition-colors">
						<Paperclip size={13} weight="light" />
					</button>
				</ComposerPrimitive.AddAttachment>

				{/* Provider badge */}
				<span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[6%] text-white/40 font-mono">
					{providerLabel(provider)}
				</span>

				{/* Workspace */}
				<div className="flex items-center gap-1 text-white/22">
					<FolderSimple size={12} weight="light" />
					<span className="text-[11px] font-mono">{workspaceBase}</span>
				</div>

				{/* Send / Cancel */}
				<div className="ml-auto">
					{isRunning ? (
						<ComposerPrimitive.Cancel asChild>
							<button className="w-8 h-8 rounded-full bg-white/[8%] border border-white/[12%] flex items-center justify-center hover:bg-white/[14%] transition-colors">
								<X size={13} weight="bold" className="text-white/60" />
							</button>
						</ComposerPrimitive.Cancel>
					) : (
						<ComposerPrimitive.Send asChild>
							<button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed hover:opacity-85 transition-all">
								<ArrowUp size={14} weight="bold" className="text-primary-foreground" />
							</button>
						</ComposerPrimitive.Send>
					)}
				</div>
			</div>
		</ComposerPrimitive.Root>
	);
}

// ─── User message ─────────────────────────────────────────────────────────────

function UserMessage() {
	return (
		<MessagePrimitive.Root className="group flex flex-col items-end gap-1.5">
			<span className="text-[11px] font-medium text-white/30 px-1">You</span>
			{/* Quoted snippet the user carried over from a prior response */}
			<MessagePrimitive.Quote>
				{({ text }) => (
					<div className="max-w-[85%] flex items-start gap-2 rounded-xl border border-white/[8%] bg-white/[3%] px-3 py-2">
						<Quotes size={11} weight="fill" className="text-white/30 shrink-0 mt-0.5" />
						<span className="flex-1 text-[12px] text-white/45 font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap select-text">
							{text}
						</span>
					</div>
				)}
			</MessagePrimitive.Quote>
			{/* Attachment chips persisted on the sent message */}
			<div className="max-w-[85%] flex flex-wrap gap-1.5 empty:hidden">
				<MessagePrimitive.Attachments>
					{({ attachment }) => (
						<div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/[8%] bg-white/[3%] text-[11px] text-white/45">
							<Paperclip size={10} weight="light" />
							<span className="max-w-[120px] truncate">{attachment.name}</span>
						</div>
					)}
				</MessagePrimitive.Attachments>
			</div>
			<div className="max-w-[85%] rounded-2xl bg-white/[5%] border border-white/[9%] px-4 py-2.5">
				<MessagePrimitive.Parts components={{ Text: UserTextPart }} />
			</div>
			<ActionBarPrimitive.Root
				hideWhenRunning
				autohide="always"
				className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
			>
				<CopyMessageButton />
			</ActionBarPrimitive.Root>
		</MessagePrimitive.Root>
	);
}

function UserTextPart({ text }: TextMessagePartProps) {
	return (
		<p className="text-[13px] leading-[1.65] text-white/80 select-text whitespace-pre-wrap">
			{text}
		</p>
	);
}

// ─── Assistant message ────────────────────────────────────────────────────────

function AssistantMessage() {
	const message = useMessage();
	const isRunning = message.status?.type === "running";
	const isError =
		message.status?.type === "incomplete" &&
		(message.status as { reason: string }).reason === "error";

	return (
		<MessagePrimitive.Root className={cn("group flex flex-col gap-2", isError && "opacity-70")}>
			<div className="flex items-center gap-2">
				<span className="text-[11px] font-medium text-white/30">assistant</span>
				{isRunning && <SpinnerGap size={11} weight="bold" className="text-white/25 animate-spin" />}
			</div>

			<div className="flex flex-col gap-2.5">
				<MessagePrimitive.Parts
					components={{
						Text: MarkdownText,
						Reasoning: ReasoningPart,
						tools: { Override: ToolCallBlock },
					}}
				/>
			</div>

			{/* Branch picker — hidden when only one branch */}
			<BranchPickerPrimitive.Root
				hideWhenSingleBranch
				className="flex items-center gap-1 text-[11px] text-white/28"
			>
				<BranchPickerPrimitive.Previous asChild>
					<button className="p-0.5 hover:text-white/55 transition-colors disabled:opacity-25">
						<CaretLeft size={11} weight="bold" />
					</button>
				</BranchPickerPrimitive.Previous>
				<span className="tabular-nums">
					<BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
				</span>
				<BranchPickerPrimitive.Next asChild>
					<button className="p-0.5 hover:text-white/55 transition-colors disabled:opacity-25">
						<CaretRight size={11} weight="bold" />
					</button>
				</BranchPickerPrimitive.Next>
			</BranchPickerPrimitive.Root>

			{/* Action bar */}
			<ActionBarPrimitive.Root
				hideWhenRunning
				autohide="not-last"
				className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity data-[state=visible]:opacity-100"
			>
				<CopyMessageButton />
				<ActionBarPrimitive.Reload asChild>
					<ActionButton tooltip="Regenerate">
						<ArrowClockwise size={11} weight="regular" />
					</ActionButton>
				</ActionBarPrimitive.Reload>
			</ActionBarPrimitive.Root>
		</MessagePrimitive.Root>
	);
}

// ─── Reasoning part ───────────────────────────────────────────────────────────

function ReasoningPart({ text, status }: ReasoningMessagePartProps) {
	const isStreaming = status?.type === "running";

	return (
		<Reasoning isStreaming={isStreaming} defaultOpen={false}>
			<ReasoningTrigger isStreaming={isStreaming} />
			<ReasoningContent>{text}</ReasoningContent>
		</Reasoning>
	);
}

// ─── Shared action button ─────────────────────────────────────────────────────

function ActionButton({
	children,
	tooltip,
	className,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tooltip?: string }) {
	return (
		<button
			title={tooltip}
			className={cn(
				"p-1.5 rounded-lg text-white/28 hover:text-white/55 hover:bg-white/[5%] transition-colors",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

// ─── Copy button with feedback + Electron-safe fallback ───────────────────────

function CopyMessageButton() {
	const [copied, setCopied] = useState(false);
	const message = useMessage();

	const handleCopy = async () => {
		const text = message.content
			.filter((p) => p.type === "text")
			.map((p) => (p as { type: "text"; text: string }).text)
			.join("\n\n");
		if (await copyText(text)) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<ActionButton onClick={handleCopy} tooltip="Copy">
			{copied ? (
				<Check size={11} weight="bold" className="text-white/55" />
			) : (
				<Copy size={11} weight="regular" />
			)}
		</ActionButton>
	);
}
