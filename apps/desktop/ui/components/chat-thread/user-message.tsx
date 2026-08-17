import { MessagePrimitive, useMessage } from "@assistant-ui/react";
import type { TextMessagePartProps } from "@assistant-ui/react";
import { Paperclip, Quotes } from "@phosphor-icons/react";
import { clockTime } from "../../lib/time";
import { CopyMessageButton } from "./copy-message-button";
import { MessageMeta } from "./message-meta";

function UserTextPart({ text }: TextMessagePartProps) {
	return (
		<p className="text-[12px] leading-[1.65] text-white/80 select-text whitespace-pre-wrap">
			{text}
		</p>
	);
}

export function UserMessage() {
	const message = useMessage();
	const sentAt = message.createdAt ?? new Date();

	return (
		<MessagePrimitive.Root className="group flex flex-col items-end gap-1.5">
			<MessagePrimitive.Quote>
				{({ text }) => (
					<div className="max-w-[85%] flex items-start gap-2 rounded-xl border border-white/[8%] bg-white/[3%] px-3 py-2">
						<Quotes size={11} weight="fill" className="text-white/30 shrink-0 mt-0.5" />
						<span className="flex-1 text-[11px] text-white/45 font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap select-text">
							{text}
						</span>
					</div>
				)}
			</MessagePrimitive.Quote>
			<div className="max-w-[85%] flex flex-wrap gap-1.5 empty:hidden">
				<MessagePrimitive.Attachments>
					{({ attachment }) => (
						<div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/[8%] bg-white/[3%] text-[10px] text-white/45">
							<Paperclip size={10} weight="light" />
							<span className="max-w-[120px] truncate">{attachment.name}</span>
						</div>
					)}
				</MessagePrimitive.Attachments>
			</div>
			<div className="max-w-[85%] rounded-2xl bg-white/[5%] border border-white/[9%] px-4 py-2.5">
				<MessagePrimitive.Parts components={{ Text: UserTextPart }} />
			</div>
			<MessageMeta timestamp={clockTime(sentAt)} align="end">
				<CopyMessageButton />
			</MessageMeta>
		</MessagePrimitive.Root>
	);
}
