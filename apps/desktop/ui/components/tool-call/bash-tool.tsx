import { Terminal } from "@phosphor-icons/react";
import type { ShellCommand } from "../../lib/tools";
import { cn } from "../../lib/utils";
import { ToolCard, type ToolStatus } from "./tool-card";

export function BashTool({
	shell,
	output,
	status,
}: {
	shell: ShellCommand;
	output: string;
	status: ToolStatus;
}) {
	const isMultiline = shell.command.includes("\n");
	const hasBody = output.length > 0 || isMultiline;

	return (
		<ToolCard
			status={status}
			defaultOpen={status === "error"}
			icon={<Terminal size={11} weight="light" className="text-white/28 shrink-0" />}
			title={
				<span className="font-mono">
					<span className="text-white/25 select-none">$ </span>
					<span className="text-white/60">{shell.command.split("\n")[0]}</span>
				</span>
			}
			meta={
				shell.description ? (
					<span className="text-[11px] text-white/25 truncate max-w-[14rem]">
						{shell.description}
					</span>
				) : undefined
			}
		>
			{hasBody ? (
				<div className="px-3.5 py-2.5 space-y-2">
					{isMultiline && (
						<code className="block font-mono text-[11.5px] leading-relaxed text-white/50 whitespace-pre-wrap break-all select-text">
							{shell.command}
						</code>
					)}
					{output.length > 0 && (
						<code
							className={cn(
								"block font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap break-all select-text",
								"max-h-[320px] overflow-y-auto",
								status === "error" ? "text-[var(--warn)]/80" : "text-white/38",
							)}
						>
							{output}
						</code>
					)}
				</div>
			) : undefined}
		</ToolCard>
	);
}
