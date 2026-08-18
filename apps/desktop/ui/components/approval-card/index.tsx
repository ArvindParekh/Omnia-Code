import { Check, X, Warning } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { ApprovalArgs } from "../../lib/types";
import { useApproval } from "./context";

export { ApprovalContext, useApproval } from "./context";

type ApprovalCardProps = ApprovalArgs & {
	toolName: string;
	command: string;
};

export function ApprovalCard({
	__approvalId,
	toolName,
	command,
	__resolved,
	__approved,
	__note,
}: ApprovalCardProps) {
	const { onApprove } = useApproval();
	const [denying, setDenying] = useState(false);
	const [note, setNote] = useState("");
	const noteRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (denying) noteRef.current?.focus();
	}, [denying]);

	if (__resolved) {
		return (
			<div className="rounded-xl border border-white/[8%] bg-white/[2%] px-3.5 py-2.5 flex flex-col gap-1">
				<div className="flex items-center gap-2.5">
					{__approved ? (
						<Check size={12} weight="bold" className="text-white/30 shrink-0" />
					) : (
						<X size={12} weight="bold" className="text-white/30 shrink-0" />
					)}
					<span className="text-[11px] font-mono text-white/28">{toolName}</span>
					<span className="text-[10px] font-mono text-white/22 truncate flex-1">{command}</span>
					<span className="text-[10px] text-white/22 shrink-0">
						{__approved ? "approved" : "denied · never ran"}
					</span>
				</div>
				{!__approved && __note ? (
					<p className="text-[10px] text-white/28 leading-relaxed pl-[22px]">{__note}</p>
				) : null}
			</div>
		);
	}

	const confirmDeny = () => {
		onApprove(__approvalId, false, note.trim() || undefined);
	};

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
					<span className="text-[10px] font-medium" style={{ color: "var(--warn)" }}>
						Approval required
					</span>
				</div>
				<span
					className="text-[9px] font-mono uppercase tracking-wider"
					style={{ color: "var(--warn)", opacity: 0.6 }}
				>
					{toolName}
				</span>
			</div>

			<div className="px-3.5 py-3 flex flex-col gap-3">
				<code className="text-[11px] font-mono text-white/60 select-text block break-all">
					{command}
				</code>
				{denying ? (
					<textarea
						ref={noteRef}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Escape") {
								e.preventDefault();
								setDenying(false);
							}
							if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
								e.preventDefault();
								confirmDeny();
							}
						}}
						placeholder="Tell the agent why (optional)"
						rows={2}
						className="w-full rounded-lg border border-white/[8%] bg-white/[3%] px-2.5 py-2
							text-[11px] text-white/70 placeholder:text-white/25 resize-none outline-none
							leading-[1.5] select-text focus:border-white/[16%]"
					/>
				) : null}
			</div>

			<div
				className="flex items-center justify-end gap-2 px-3.5 py-2.5 border-t"
				style={{ borderColor: "var(--warn-border)" }}
			>
				{denying ? (
					<button
						onClick={() => setDenying(false)}
						className="px-3 py-1.5 text-[11px] rounded-lg text-white/35
							hover:bg-white/[5%] hover:text-white/55 transition-colors"
					>
						Cancel
					</button>
				) : null}
				<button
					onClick={() => (denying ? confirmDeny() : setDenying(true))}
					className="px-3 py-1.5 text-[11px] rounded-lg border border-white/[10%] text-white/45
						hover:bg-white/[5%] hover:text-white/65 transition-colors"
				>
					Deny
				</button>
				<button
					onClick={() => onApprove(__approvalId, true)}
					className="px-3 py-1.5 text-[11px] rounded-lg bg-primary text-primary-foreground font-medium
						hover:opacity-85 transition-all"
				>
					Approve
				</button>
			</div>
		</div>
	);
}
