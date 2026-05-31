import {
	ComposerPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
	useMessage,
	useThreadRuntime,
} from "@assistant-ui/react";
import type { TextMessagePartProps, ToolCallMessagePartProps } from "@assistant-ui/react";
import {
	ArrowUp,
	Check,
	X,
	Terminal,
	SpinnerGap,
	ArrowDown,
	FolderSimple,
	Warning,
} from "@phosphor-icons/react";
import { useApproval } from "../App";
import type { MockSession } from "../App";
import { providerLabel } from "../lib/provider";
import { cn } from "../lib/utils";

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
					{/* Empty state */}
					<ThreadPrimitive.Empty>
						<div className="flex flex-col items-center justify-center flex-1 gap-2 py-20">
							<p className="text-[13px] text-white/25">Ask {label} anything</p>
						</div>
					</ThreadPrimitive.Empty>

					{/* Messages */}
					<div className="flex flex-col px-5 py-6 gap-6 max-w-[700px] mx-auto w-full">
						<ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
					</div>

					{/* Sticky footer: scroll button + composer */}
					<ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto bg-[var(--background)]">
						<div className="max-w-[700px] mx-auto w-full px-5 pb-5 pt-2 relative">
							{/* Scroll to bottom button */}
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
			<div className="flex items-center gap-2 px-3.5 pb-3 pt-1 border-t border-white/[5%]">
				{/* Provider badge */}
				<div className="flex items-center gap-1.5">
					<span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[6%] text-white/40 font-mono">
						{label}
					</span>
				</div>

				{/* Workspace */}
				<div className="flex items-center gap-1 text-white/25">
					<FolderSimple size={12} weight="light" />
					<span className="text-[11px] font-mono">{workspaceBase}</span>
				</div>

				{/* Send / Cancel */}
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
		<MessagePrimitive.Root className="flex flex-col gap-1.5">
			<span className="text-[11px] font-medium text-white/30">You</span>
			<MessagePrimitive.Parts components={{ Text: UserTextPart }} />
		</MessagePrimitive.Root>
	);
}

function UserTextPart({ text }: TextMessagePartProps) {
	return (
		<p className="text-[13px] leading-[1.65] text-white/75 select-text whitespace-pre-wrap">
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
						tools: { Override: ToolCallPart },
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

// ─── Tool call part ───────────────────────────────────────────────────────────

function ToolCallPart({ toolName, args, result, status }: ToolCallMessagePartProps) {
	const isApproval =
		typeof args === "object" &&
		args !== null &&
		(args as Record<string, unknown>).__isApproval === true;

	if (isApproval) {
		const a = args as Record<string, unknown>;
		return (
			<ApprovalCard
				approvalId={a.__approvalId as string}
				toolName={toolName}
				command={(a.command as string) ?? (a.path as string) ?? JSON.stringify(args)}
				resolved={a.__resolved as boolean}
				approved={a.__approved as boolean | null}
			/>
		);
	}

	const primaryArg =
		typeof args === "object" && args !== null
			? (((args as Record<string, unknown>).path as string) ??
				((args as Record<string, unknown>).command as string) ??
				JSON.stringify(args))
			: String(args);

	const output =
		typeof result === "object" && result !== null && "output" in (result as object)
			? (result as { output: string }).output
			: result != null
				? String(result)
				: undefined;

	const isRunning = status?.type === "running";

	return (
		<div className="rounded-xl border border-white/[8%] bg-white/[2%] overflow-hidden text-[12px]">
			<div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[5%]">
				<div className="flex items-center gap-2">
					<Terminal size={11} weight="light" className="text-white/28 shrink-0" />
					<span className="font-mono text-white/38">{toolName}</span>
				</div>
				<div className="flex items-center gap-1.5">
					{isRunning ? (
						<SpinnerGap size={10} weight="bold" className="text-white/25 animate-spin" />
					) : (
						output && <span className="font-mono text-white/28 text-[11px]">{output}</span>
					)}
				</div>
			</div>
			<div className="px-3.5 py-2.5">
				<span className="font-mono text-white/48 break-all">{primaryArg}</span>
			</div>
		</div>
	);
}

// ─── Approval card ────────────────────────────────────────────────────────────

function ApprovalCard({
	approvalId,
	toolName,
	command,
	resolved,
	approved,
}: {
	approvalId: string;
	toolName: string;
	command: string;
	resolved: boolean;
	approved: boolean | null;
}) {
	const { onApprove } = useApproval();

	if (resolved) {
		return (
			<div className="rounded-xl border border-white/[8%] bg-white/[2%] px-3.5 py-2.5 flex items-center gap-2.5">
				{approved ? (
					<Check size={12} weight="bold" className="text-white/30 shrink-0" />
				) : (
					<X size={12} weight="bold" className="text-white/30 shrink-0" />
				)}
				<span className="text-[12px] font-mono text-white/28">{toolName}</span>
				<span className="text-[11px] font-mono text-white/22 truncate flex-1">{command}</span>
				<span className="text-[11px] text-white/22 shrink-0">
					{approved ? "approved" : "denied"}
				</span>
			</div>
		);
	}

	return (
		<div
			className="rounded-xl overflow-hidden border"
			style={{ borderColor: "var(--warn-border)", backgroundColor: "var(--warn-bg)" }}
		>
			<div
				className="flex items-center justify-between px-3.5 py-2 border-b"
				style={{ borderColor: "var(--warn-border)" }}
			>
				<div className="flex items-center gap-2">
					<Warning size={12} weight="fill" style={{ color: "var(--warn)" }} />
					<span className="text-[11px] font-medium" style={{ color: "var(--warn)" }}>
						Approval required
					</span>
				</div>
				<span
					className="text-[10px] font-mono uppercase tracking-wider"
					style={{ color: "var(--warn)", opacity: 0.6 }}
				>
					{toolName}
				</span>
			</div>

			<div className="px-3.5 py-3">
				<code className="text-[12px] font-mono text-white/60 select-text block break-all">
					{command}
				</code>
			</div>

			<div
				className="flex items-center justify-end gap-2 px-3.5 py-2.5 border-t"
				style={{ borderColor: "var(--warn-border)" }}
			>
				<button
					onClick={() => onApprove(approvalId, false)}
					className="px-3 py-1.5 text-[12px] rounded-lg border border-white/[10%] text-white/45
						hover:bg-white/[5%] hover:text-white/65 transition-colors"
				>
					Deny
				</button>
				<button
					onClick={() => onApprove(approvalId, true)}
					className="px-3 py-1.5 text-[12px] rounded-lg bg-white/88 text-[#171717] font-medium
						hover:bg-white transition-colors"
				>
					Approve
				</button>
			</div>
		</div>
	);
}
