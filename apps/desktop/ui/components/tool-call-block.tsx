import { Terminal, SpinnerGap } from "@phosphor-icons/react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import type { ApprovalArgs } from "../lib/types";
import { ApprovalCard } from "./approval-card";

// Renders a single tool call from the assistant message.
// If the args contain ApprovalArgs metadata (injected by convert-messages.ts),
// renders an ApprovalCard instead of the standard tool call card.
export function ToolCallBlock({ toolName, args, result, status }: ToolCallMessagePartProps) {
	const typedArgs = args as Record<string, unknown>;

	if (typedArgs.__isApproval === true) {
		const meta = args as unknown as ApprovalArgs;
		const command =
			(typedArgs.command as string) ?? (typedArgs.path as string) ?? JSON.stringify(args);
		return <ApprovalCard {...meta} toolName={toolName} command={command} />;
	}

	const primaryArg =
		(typedArgs.path as string) ?? (typedArgs.command as string) ?? JSON.stringify(args);

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
