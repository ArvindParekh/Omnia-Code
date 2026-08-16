import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import {
	describeLookup,
	parseFileEdit,
	parseShellCommand,
	stringifyToolOutput,
} from "../../lib/tools";
import type { ApprovalArgs } from "../../lib/types";
import { ApprovalCard } from "../approval-card";
import { BashTool } from "./bash-tool";
import { CompactTool } from "./compact-tool";
import { DiffTool } from "./diff-tool";
import { GenericTool } from "./generic-tool";
import type { ToolStatus } from "./tool-card";

function resolveStatus(props: ToolCallMessagePartProps): ToolStatus {
	if (props.status?.type === "running") return "running";

	const { isError } = props as { isError?: boolean };
	if (isError) return "error";

	if (props.status?.type === "incomplete" && props.status.reason === "error") return "error";
	return "done";
}

export function ToolCallBlock(props: ToolCallMessagePartProps) {
	const { toolName, args, result } = props;
	const typedArgs = args as Record<string, unknown>;

	if (typedArgs.__isApproval === true) {
		const meta = args as unknown as ApprovalArgs;
		const command =
			(typedArgs.command as string) ?? (typedArgs.file_path as string) ?? JSON.stringify(args);
		return <ApprovalCard {...meta} toolName={toolName} command={command} />;
	}

	const status = resolveStatus(props);
	const output = stringifyToolOutput(result);

	const edit = parseFileEdit(toolName, typedArgs);
	if (edit) return <DiffTool edit={edit} status={status} isCreate={toolName === "Write"} />;

	if (toolName === "Bash") {
		const shell = parseShellCommand(typedArgs);
		if (shell) return <BashTool shell={shell} output={output} status={status} />;
	}

	const headline = describeLookup(toolName, typedArgs);
	if (headline) {
		return <CompactTool toolName={toolName} headline={headline} output={output} status={status} />;
	}

	return <GenericTool toolName={toolName} args={typedArgs} output={output} status={status} />;
}
