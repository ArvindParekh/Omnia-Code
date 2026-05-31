import { useRef, useEffect } from "react";
import { ArrowUp, Terminal, Spinner, Warning, Check, X } from "@phosphor-icons/react";
import type { MockSession, ChatMessage } from "../App";
import { providerLabel } from "../lib/provider";
import { timeAgo } from "../lib/time";

type ChatViewProps = {
	session: MockSession;
	messages: ChatMessage[];
	inputValue: string;
	onInputChange: (value: string) => void;
	onSend: () => void;
	onApprove: (id: string, approved: boolean) => void;
};

export function ChatView({
	session,
	messages,
	inputValue,
	onInputChange,
	onSend,
	onApprove,
}: ChatViewProps) {
	const bottomRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const label = providerLabel(session.provider);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (inputValue.trim()) onSend();
		}
	};

	const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onInputChange(e.target.value);
		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
	};

	const workspaceBase = session.workspacePath.replace(/^.*\//, "");

	return (
		<div className="flex flex-col flex-1 overflow-hidden border-r border-white/[6%]">
			{/* Header */}
			<div className="flex items-center justify-between px-5 py-3 border-b border-white/[6%] shrink-0">
				<div className="flex items-center gap-3 min-w-0">
					<span className="text-[13px] font-medium text-white/80 truncate">{session.title}</span>
					<span className="text-[11px] text-white/25 shrink-0 hidden sm:block">
						{label} &middot; {workspaceBase}
					</span>
				</div>
				{session.status === "running" && (
					<span className="text-[11px] text-white/30 shrink-0">running</span>
				)}
				{session.status === "error" && (
					<span className="text-[11px] text-white/30 shrink-0">failed</span>
				)}
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto">
				{messages.length === 0 ? (
					<EmptyChat providerLabel={label} />
				) : (
					<div className="flex flex-col px-6 py-6 gap-5 max-w-[680px] mx-auto">
						{messages.map((msg) => (
							<MessageRow key={msg.id} message={msg} session={session} onApprove={onApprove} />
						))}
						<div ref={bottomRef} />
					</div>
				)}
			</div>

			{/* Input */}
			<div className="shrink-0 px-5 pb-5 pt-3 border-t border-white/[6%]">
				<div className="max-w-[680px] mx-auto">
					<div
						className="flex gap-2 items-end rounded-lg border border-white/[9%]
							bg-white/[3%] px-3.5 py-3 transition-all duration-150
							focus-within:border-white/[16%] focus-within:bg-white/[4%]"
					>
						<textarea
							ref={textareaRef}
							value={inputValue}
							onChange={handleInput}
							onKeyDown={handleKeyDown}
							placeholder={`Ask ${label}...`}
							rows={1}
							className="flex-1 bg-transparent text-[13px] text-white/80
								placeholder:text-white/22 resize-none outline-none leading-[1.55]
								min-h-[20px] overflow-y-hidden selectable"
						/>
						<button
							onClick={onSend}
							disabled={!inputValue.trim()}
							className="p-1.5 rounded-[5px] bg-white/[9%] hover:bg-white/[14%]
								disabled:opacity-25 disabled:cursor-not-allowed
								transition-colors shrink-0"
						>
							<ArrowUp size={13} className="text-white/75" />
						</button>
					</div>

					{/* Context bar */}
					<div className="flex items-center gap-2 mt-2 px-1">
						<div className="flex items-center gap-1.5">
							<span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[5%] text-white/30 font-mono">
								{label}
							</span>
							<span className="text-[11px] font-mono text-white/18">{session.workspacePath}</span>
						</div>
						<span className="ml-auto text-[10px] text-white/14">Return to send</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function MessageRow({
	message,
	session,
	onApprove,
}: {
	message: ChatMessage;
	session: MockSession;
	onApprove: (id: string, approved: boolean) => void;
}) {
	const label = providerLabel(session.provider);

	if (message.kind === "user") {
		return (
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-medium text-white/35">You</span>
					<span className="text-[10px] text-white/18">{timeAgo(message.timestamp)}</span>
				</div>
				<p className="text-[13px] leading-[1.65] text-white/75 selectable whitespace-pre-wrap pl-0">
					{message.text}
				</p>
			</div>
		);
	}

	if (message.kind === "assistant") {
		return (
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-medium text-white/35">{label}</span>
					{message.streaming && <Spinner size={10} className="text-white/25 animate-spin" />}
				</div>
				<p
					className={`text-[13px] leading-[1.65] text-white/75 selectable whitespace-pre-wrap
						${message.streaming ? "streaming-cursor" : ""}`}
				>
					{message.text}
				</p>
			</div>
		);
	}

	if (message.kind === "tool") {
		return <ToolCallBlock message={message} />;
	}

	if (message.kind === "approval") {
		return (
			<ApprovalCard
				id={message.id}
				toolName={message.toolName}
				input={message.input}
				resolved={message.resolved}
				approved={message.approved}
				onApprove={onApprove}
			/>
		);
	}

	if (message.kind === "error") {
		return (
			<div className="rounded-md border border-white/[8%] bg-white/[2%] px-4 py-3">
				<p className="text-[12px] text-white/40 leading-relaxed selectable font-mono">
					{message.message}
				</p>
			</div>
		);
	}

	return null;
}

function ToolCallBlock({ message }: { message: Extract<ChatMessage, { kind: "tool" }> }) {
	const primaryArg =
		(message.input.path as string) ??
		(message.input.command as string) ??
		JSON.stringify(message.input);

	return (
		<div className="rounded-[6px] border border-white/[8%] bg-white/[2%] overflow-hidden">
			{/* Header row */}
			<div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[6%]">
				<div className="flex items-center gap-2">
					<Terminal size={11} className="text-white/28 shrink-0" />
					<span className="text-[11px] font-mono text-white/35">{message.name}</span>
				</div>
				<div className="flex items-center gap-1.5">
					{message.status === "running" && (
						<Spinner size={10} className="text-white/25 animate-spin" />
					)}
					{message.status === "done" && message.output && (
						<span className="text-[10px] font-mono text-white/25">{message.output}</span>
					)}
					{message.status === "error" && (
						<span className="text-[10px] font-mono text-white/30">error</span>
					)}
				</div>
			</div>
			{/* Content */}
			<div className="px-3.5 py-2.5">
				<span className="text-[12px] font-mono text-white/50 break-all">{primaryArg}</span>
			</div>
		</div>
	);
}

function ApprovalCard({
	id,
	toolName,
	input,
	resolved,
	approved,
	onApprove,
}: {
	id: string;
	toolName: string;
	input: Record<string, unknown>;
	resolved: boolean;
	approved?: boolean;
	onApprove: (id: string, approved: boolean) => void;
}) {
	const primaryArg = (input.command as string) ?? (input.path as string) ?? JSON.stringify(input);

	if (resolved) {
		return (
			<div className="rounded-[6px] border border-white/[8%] bg-white/[2%] px-4 py-3">
				<div className="flex items-center gap-2">
					{approved ? (
						<Check size={12} className="text-white/35" weight="bold" />
					) : (
						<X size={12} className="text-white/35" weight="bold" />
					)}
					<span className="text-[12px] text-white/30 font-mono">{toolName}</span>
					<span className="text-[11px] font-mono text-white/22 truncate">{primaryArg}</span>
				</div>
			</div>
		);
	}

	return (
		<div
			className="rounded-[6px] border overflow-hidden"
			style={{
				borderColor: "var(--warn-border)",
				backgroundColor: "var(--warn-bg)",
			}}
		>
			{/* Warning header */}
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
					style={{ color: "var(--warn)", opacity: 0.65 }}
				>
					high risk
				</span>
			</div>

			{/* Command */}
			<div className="px-3.5 py-3">
				<div className="flex items-center gap-2 mb-1">
					<span className="text-[11px] font-mono text-white/35">{toolName}</span>
				</div>
				<code className="text-[12px] font-mono text-white/60 selectable block break-all">
					{primaryArg}
				</code>
			</div>

			{/* Actions */}
			<div
				className="flex items-center justify-end gap-2 px-3.5 py-2.5 border-t"
				style={{ borderColor: "var(--warn-border)" }}
			>
				<button
					onClick={() => onApprove(id, false)}
					className="px-3 py-1.5 text-[12px] rounded-[5px]
						border border-white/[10%] text-white/45
						hover:bg-white/[5%] hover:text-white/65 transition-colors"
				>
					Deny
				</button>
				<button
					onClick={() => onApprove(id, true)}
					className="px-3 py-1.5 text-[12px] rounded-[5px]
						bg-white/88 text-[#111111] font-medium
						hover:bg-white/95 transition-colors"
				>
					Approve
				</button>
			</div>
		</div>
	);
}

function EmptyChat({ providerLabel }: { providerLabel: string }) {
	return (
		<div className="flex flex-col items-center justify-center h-full gap-2 text-center px-8">
			<p className="text-[13px] text-white/30">Ask {providerLabel} anything</p>
		</div>
	);
}
