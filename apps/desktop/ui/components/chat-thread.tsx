import {
	ComposerPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
	useMessage,
	useThreadRuntime,
} from "@assistant-ui/react";
import type { TextMessagePartProps } from "@assistant-ui/react";
import { ArrowUp, X, FolderSimple, SpinnerGap, ArrowDown } from "@phosphor-icons/react";
import type { MockSession } from "../lib/types";
import { providerLabel } from "../lib/provider";
import { cn } from "../lib/utils";
import { ToolCallBlock } from "./tool-call-block";

// ─── Thread shell ─────────────────────────────────────────────────────────────

export function ChatThread({ session }: { session: MockSession }) {
	const label = providerLabel(session.provider);
	const workspaceBase = session.workspacePath.replace(/^.*\//, "");

	return (
		<ThreadPrimitive.Root className="flex flex-col flex-1 overflow-hidden border-r border-white/[7%]">
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

			{/* Viewport — contains messages + sticky composer */}
			<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
				<div className="flex flex-col min-h-full">
					<ThreadPrimitive.Empty>
						<div className="flex flex-col items-center justify-center flex-1 gap-2 py-20">
							<p className="text-[13px] text-white/25">Ask {label} anything</p>
						</div>
					</ThreadPrimitive.Empty>

					<div className="flex flex-col px-5 py-6 gap-6 max-w-[700px] mx-auto w-full">
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

							<Composer label={label} workspacePath={session.workspacePath} />
						</div>
					</ThreadPrimitive.ViewportFooter>
				</div>
			</ThreadPrimitive.Viewport>
		</ThreadPrimitive.Root>
	);
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({ label, workspacePath }: { label: string; workspacePath: string }) {
	const threadRuntime = useThreadRuntime();
	const isRunning = threadRuntime.getState().isRunning;
	const workspaceBase = workspacePath.replace(/^.*\//, "");

	return (
		<ComposerPrimitive.Root
			className="rounded-2xl border border-white/[9%] bg-white/[3%] overflow-hidden
				focus-within:border-white/[16%] focus-within:bg-white/[4%] transition-all"
		>
			<div className="px-4 pt-3.5 pb-2">
				<ComposerPrimitive.Input
					placeholder={`Ask ${label}...`}
					rows={1}
					className="w-full bg-transparent text-[13px] text-white/80 placeholder:text-white/25
						resize-none outline-none leading-[1.6] select-text"
				/>
			</div>

			<div className="flex items-center gap-2 px-3.5 pb-3 pt-1 border-t border-white/[5%]">
				<span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[6%] text-white/40 font-mono">
					{label}
				</span>
				<div className="flex items-center gap-1 text-white/25">
					<FolderSimple size={12} weight="light" />
					<span className="text-[11px] font-mono">{workspaceBase}</span>
				</div>
				<div className="ml-auto">
					{isRunning ? (
						<ComposerPrimitive.Cancel asChild>
							<button
								className="w-8 h-8 rounded-full bg-white/[8%] border border-white/[12%]
									flex items-center justify-center hover:bg-white/[14%] transition-colors"
							>
								<X size={13} weight="bold" className="text-white/60" />
							</button>
						</ComposerPrimitive.Cancel>
					) : (
						<ComposerPrimitive.Send asChild>
							<button
								className="w-8 h-8 rounded-full bg-white/88 flex items-center justify-center
									disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white transition-colors"
							>
								<ArrowUp size={14} weight="bold" className="text-[#171717]" />
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
		<MessagePrimitive.Root className="flex flex-col items-end gap-1.5">
			<span className="text-[11px] font-medium text-white/30 px-1">You</span>
			<div className="max-w-[85%] rounded-2xl bg-white/[5%] border border-white/[9%] px-4 py-2.5">
				<MessagePrimitive.Parts components={{ Text: UserTextPart }} />
			</div>
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
		<MessagePrimitive.Root className={cn("flex flex-col gap-2", isError && "opacity-70")}>
			<div className="flex items-center gap-2">
				<span className="text-[11px] font-medium text-white/30">assistant</span>
				{isRunning && <SpinnerGap size={11} weight="bold" className="text-white/25 animate-spin" />}
			</div>
			<div className="flex flex-col gap-2.5">
				<MessagePrimitive.Parts
					components={{
						Text: AssistantTextPart,
						tools: { Override: ToolCallBlock },
					}}
				/>
			</div>
		</MessagePrimitive.Root>
	);
}

function AssistantTextPart({ text, status }: TextMessagePartProps) {
	const isRunning = status?.type === "running";
	return (
		<p
			className={cn(
				"text-[13px] leading-[1.65] text-white/72 select-text whitespace-pre-wrap",
				isRunning && "streaming-cursor",
			)}
		>
			{text}
		</p>
	);
}
