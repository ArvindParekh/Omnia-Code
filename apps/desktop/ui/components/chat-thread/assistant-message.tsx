import {
	ActionBarPrimitive,
	BranchPickerPrimitive,
	MessagePrimitive,
	useMessage,
} from "@assistant-ui/react";
import { ArrowClockwise, CaretLeft, CaretRight, SpinnerGap } from "@phosphor-icons/react";
import { clockTime, elapsed } from "../../lib/time";
import { cn } from "../../lib/utils";
import { ToolCallBlock } from "../tool-call";
import { MarkdownText } from "../assistant-ui/markdown-text";
import { ReasoningPart } from "./reasoning-part";
import { ActionButton } from "./action-button";
import { CopyMessageButton } from "./copy-message-button";
import { MessageMeta } from "./message-meta";

export function AssistantMessage() {
	const message = useMessage();
	const isRunning = message.status?.type === "running";
	const isError =
		message.status?.type === "incomplete" &&
		(message.status as { reason: string }).reason === "error";

	const startedAt = message.createdAt ?? new Date();
	const completedAt =
		(message.metadata?.custom?.completedAt as number | undefined) ?? startedAt.getTime();
	const duration = elapsed(startedAt, completedAt);

	return (
		<MessagePrimitive.Root className={cn("group flex flex-col gap-2", isError && "opacity-70")}>
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
				className="flex items-center gap-1 text-[10px] text-white/28"
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

			{isRunning ? (
				<div className="flex h-[22px] items-center gap-1.5 text-white/28">
					<SpinnerGap size={10} weight="bold" className="animate-spin" />
					<span className="text-[9px]">working</span>
				</div>
			) : (
				<MessageMeta timestamp={clockTime(completedAt)} detail={duration} align="start">
					<CopyMessageButton />
					<ActionBarPrimitive.Reload asChild>
						<ActionButton tooltip="Regenerate">
							<ArrowClockwise size={11} weight="regular" />
						</ActionButton>
					</ActionBarPrimitive.Reload>
				</MessageMeta>
			)}
		</MessagePrimitive.Root>
	);
}
