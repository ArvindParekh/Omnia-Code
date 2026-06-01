import type { ReasoningMessagePartProps } from "@assistant-ui/react";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "../prompt-kit/reasoning";

export function ReasoningPart({ text, status }: ReasoningMessagePartProps) {
	const isStreaming = status?.type === "running";

	return (
		<Reasoning isStreaming={isStreaming} defaultOpen={false}>
			<ReasoningTrigger isStreaming={isStreaming} />
			<ReasoningContent>{text}</ReasoningContent>
		</Reasoning>
	);
}
