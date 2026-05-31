import { createContext, useContext } from "react";
import { Check, X, Warning } from "@phosphor-icons/react";
import type { ApprovalArgs } from "../lib/types";

// ─── Context ──────────────────────────────────────────────────────────────────
// Carries the approval callback down to ApprovalCard without threading it
// through the assistant-ui message rendering tree.

type ApprovalContextValue = {
	onApprove: (id: string, approved: boolean) => void;
};

export const ApprovalContext = createContext<ApprovalContextValue | null>(null);

export function useApproval() {
	const ctx = useContext(ApprovalContext);
	if (!ctx) throw new Error("useApproval must be used inside ApprovalContext.Provider");
	return ctx;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
}: ApprovalCardProps) {
	const { onApprove } = useApproval();

	if (__resolved) {
		return (
			<div className="rounded-xl border border-white/[8%] bg-white/[2%] px-3.5 py-2.5 flex items-center gap-2.5">
				{__approved ? (
					<Check size={12} weight="bold" className="text-white/30 shrink-0" />
				) : (
					<X size={12} weight="bold" className="text-white/30 shrink-0" />
				)}
				<span className="text-[12px] font-mono text-white/28">{toolName}</span>
				<span className="text-[11px] font-mono text-white/22 truncate flex-1">{command}</span>
				<span className="text-[11px] text-white/22 shrink-0">
					{__approved ? "approved" : "denied"}
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
					onClick={() => onApprove(__approvalId, false)}
					className="px-3 py-1.5 text-[12px] rounded-lg border border-white/[10%] text-white/45
						hover:bg-white/[5%] hover:text-white/65 transition-colors"
				>
					Deny
				</button>
				<button
					onClick={() => onApprove(__approvalId, true)}
					className="px-3 py-1.5 text-[12px] rounded-lg bg-white/88 text-[#171717] font-medium
						hover:bg-white transition-colors"
				>
					Approve
				</button>
			</div>
		</div>
	);
}
