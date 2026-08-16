import { Cube } from "@phosphor-icons/react";
import { getToolPrimaryArg } from "../../lib/tool-call";
import { ToolCard, type ToolStatus } from "./tool-card";

export function GenericTool({
	toolName,
	args,
	output,
	status,
}: {
	toolName: string;
	args: Record<string, unknown>;
	output: string;
	status: ToolStatus;
}) {
	const headline = getToolPrimaryArg(args);

	return (
		<ToolCard
			status={status}
			icon={<Cube size={11} weight="light" className="text-white/28 shrink-0" />}
			title={
				<span className="font-mono">
					<span className="text-white/38">{toolName} </span>
					<span className="text-white/55">{headline}</span>
				</span>
			}
		>
			{output.length > 0 ? (
				<code className="block px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed text-white/38 whitespace-pre-wrap break-all select-text max-h-[320px] overflow-y-auto">
					{output}
				</code>
			) : undefined}
		</ToolCard>
	);
}
