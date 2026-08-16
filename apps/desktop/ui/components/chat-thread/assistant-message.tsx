import {
	ActionBarPrimitive,
	BranchPickerPrimitive,
	MessagePrimitive,
	useMessage,
} from "@assistant-ui/react";
import { ArrowClockwise, CaretLeft, CaretRight, SpinnerGap } from "@phosphor-icons/react";
import { cn } from "../../lib/utils";
import { ToolCallBlock } from "../tool-call";
import { MarkdownText } from "../assistant-ui/markdown-text";
import { ReasoningPart } from "./reasoning-part";
import { ActionButton } from "./action-button";
import { CopyMessageButton } from "./copy-message-button";

export function AssistantMessage() {
	const message = useMessage();
	const isRunning = message.status?.type === "running";
	const isError =
		message.status?.type === "incomplete" &&
		(message.status as { reason: string }).reason === "error";

	return (
		<MessagePrimitive.Root className={cn("group flex flex-col gap-2", isError && "opacity-70")}>
			<div className="flex items-center gap-2">
				<span className="text-[11px] font-medium text-white/30">assistant</span>
				{isRunning && <SpinnerGap size={11} weight="bold" className="text-white/25 animate-spin" />}
			</div>

			<div className="flex flex-col gap-2.5">
				<MessagePrimitive.Parts
					components={{
						Text: MarkdownText,
						Reasoning: ReasoningPart,
						tools: { Override: ToolCallBlock },
					}}
				/>
			</div>

			<BranchPickerPrimitive.Root
				hideWhenSingleBranch
				className="flex items-center gap-1 text-[11px] text-white/28"
			>
				<BranchPickerPrimitive.Previous asChild>
					<button className="p-0.5 hover:text-white/55 transition-colors disabled:opacity-25">
						<CaretLeft size={11} weight="bold" />
					</button>
				</BranchPickerPrimitive.Previous>
				<span className="tabular-nums">
					<BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
				</span>
				<BranchPickerPrimitive.Next asChild>
					<button className="p-0.5 hover:text-white/55 transition-colors disabled:opacity-25">
						<CaretRight size={11} weight="bold" />
					</button>
				</BranchPickerPrimitive.Next>
			</BranchPickerPrimitive.Root>

			<ActionBarPrimitive.Root
				hideWhenRunning
				autohide="not-last"
				className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity data-[state=visible]:opacity-100"
			>
				<CopyMessageButton />
				<ActionBarPrimitive.Reload asChild>
					<ActionButton tooltip="Regenerate">
						<ArrowClockwise size={11} weight="regular" />
					</ActionButton>
				</ActionBarPrimitive.Reload>
			</ActionBarPrimitive.Root>
		</MessagePrimitive.Root>
	);
}
