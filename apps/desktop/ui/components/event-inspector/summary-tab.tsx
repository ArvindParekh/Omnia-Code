import { ToolRisk } from "@omnia/contracts";
import { Terminal, Warning } from "@phosphor-icons/react";
import { useMemo } from "react";
import { computeSessionSummary } from "../../lib/session-summary";
import type { SessionViewItem } from "../../lib/types";
import { cn } from "../../lib/utils";

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	const minutes = Math.floor(ms / 60_000);
	const seconds = Math.round((ms % 60_000) / 1000);
	return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span
				className={cn(
					"text-[12px] font-medium tabular-nums",
					tone === "warn" ? "text-[var(--warn)]" : "text-white/70",
				)}
			>
				{value}
			</span>
			<span className="text-[9px] uppercase tracking-[0.08em] text-white/22">{label}</span>
		</div>
	);
}

function Section({
	title,
	count,
	children,
}: {
	title: string;
	count: number;
	children: React.ReactNode;
}) {
	if (count === 0) return null;

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-baseline justify-between px-4">
				<span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/22">
					{title}
				</span>
				<span className="text-[9px] font-mono tabular-nums text-white/18">{count}</span>
			</div>
			<div className="flex flex-col">{children}</div>
		</div>
	);
}

export function SummaryTab({ items }: { items: SessionViewItem[] }) {
	const summary = useMemo(() => computeSessionSummary(items), [items]);

	if (items.length === 0) {
		return (
			<div className="flex items-center justify-center py-10">
				<p className="text-[10px] text-white/20">Nothing yet</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5 py-3">
			<div className="grid grid-cols-3 gap-y-3 px-4">
				<Stat label="Turns" value={String(summary.turns)} />
				<Stat label="Elapsed" value={formatDuration(summary.durationMs)} />
				<Stat label="Tools" value={String(summary.toolCalls)} />
				<Stat label="Files" value={String(summary.files.length)} />
				<Stat
					label="High risk"
					value={String(summary.highRiskCalls)}
					tone={summary.highRiskCalls > 0 ? "warn" : undefined}
				/>
				<Stat
					label="Errors"
					value={String(summary.errors.length)}
					tone={summary.errors.length > 0 ? "warn" : undefined}
				/>
			</div>

			<Section title="Files touched" count={summary.files.length}>
				{summary.files.map((file) => (
					<div
						key={file.path}
						title={file.path}
						className="flex items-center gap-2 px-4 py-[3px] hover:bg-white/[3%] transition-colors"
					>
						<span className="min-w-0 flex-1 truncate font-mono text-[10px]">
							<span className="text-white/22">{file.directory}</span>
							<span className="text-white/55">{file.name}</span>
						</span>
						{file.edits > 1 && (
							<span className="shrink-0 font-mono text-[9px] text-white/20 tabular-nums">
								×{file.edits}
							</span>
						)}
						<span className="shrink-0 font-mono text-[9px] tabular-nums">
							{file.added > 0 && <span className="text-[var(--diff-add)]">+{file.added}</span>}
							{file.added > 0 && file.removed > 0 && <span className="text-white/15"> </span>}
							{file.removed > 0 && (
								<span className="text-[var(--diff-remove)]">−{file.removed}</span>
							)}
						</span>
					</div>
				))}
			</Section>

			<Section title="Commands" count={summary.commands.length}>
				{summary.commands.map((command) => (
					<div
						key={command.id}
						title={command.command}
						className="flex items-center gap-2 px-4 py-[3px] hover:bg-white/[3%] transition-colors"
					>
						<Terminal
							size={10}
							weight="light"
							className={cn(
								"shrink-0",
								command.risk === ToolRisk.HIGH ? "text-[var(--warn)]/70" : "text-white/22",
							)}
						/>
						<span
							className={cn(
								"min-w-0 flex-1 truncate font-mono text-[10px]",
								command.status === "error" ? "text-[var(--warn)]/75" : "text-white/48",
							)}
						>
							{command.command.split("\n")[0]}
						</span>
						{command.status === "error" && (
							<Warning size={9} weight="fill" className="shrink-0 text-[var(--warn)]" />
						)}
					</div>
				))}
			</Section>

			<Section
				title="Approvals"
				count={summary.approvals.approved + summary.approvals.denied + summary.approvals.pending}
			>
				<div className="flex gap-4 px-4 pt-0.5">
					<Stat label="Approved" value={String(summary.approvals.approved)} />
					<Stat label="Denied" value={String(summary.approvals.denied)} />
					<Stat
						label="Pending"
						value={String(summary.approvals.pending)}
						tone={summary.approvals.pending > 0 ? "warn" : undefined}
					/>
				</div>
			</Section>

			<Section title="Errors" count={summary.errors.length}>
				{summary.errors.map((error) => (
					<div key={error.id} className="px-4 py-[3px]">
						<span className="block font-mono text-[10px] leading-relaxed text-[var(--warn)]/70">
							{error.message.split("\n")[0]}
						</span>
					</div>
				))}
			</Section>
		</div>
	);
}
