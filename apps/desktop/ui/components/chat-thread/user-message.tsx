import { ActionBarPrimitive, MessagePrimitive } from "@assistant-ui/react";
import type { TextMessagePartProps } from "@assistant-ui/react";
import { Paperclip, Quotes } from "@phosphor-icons/react";
import { CopyMessageButton } from "./copy-message-button";

function UserTextPart({ text }: TextMessagePartProps) {
	return (
		<p className="text-[13px] leading-[1.65] text-white/80 select-text whitespace-pre-wrap">
			{text}
		</p>
	);
}

export function UserMessage() {
	return (
		<MessagePrimitive.Root className="group flex flex-col items-end gap-1.5">
			<span className="text-[11px] font-medium text-white/30 px-1">You</span>
			<MessagePrimitive.Quote>
				{({ text }) => (
					<div className="max-w-[85%] flex items-start gap-2 rounded-xl border border-white/[8%] bg-white/[3%] px-3 py-2">
						<Quotes size={11} weight="fill" className="text-white/30 shrink-0 mt-0.5" />
						<span className="flex-1 text-[12px] text-white/45 font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap select-text">
							{text}
						</span>
					</div>
				)}
			</MessagePrimitive.Quote>
			<div className="max-w-[85%] flex flex-wrap gap-1.5 empty:hidden">
				<MessagePrimitive.Attachments>
					{({ attachment }) => (
						<div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/[8%] bg-white/[3%] text-[11px] text-white/45">
							<Paperclip size={10} weight="light" />
							<span className="max-w-[120px] truncate">{attachment.name}</span>
						</div>
					)}
				</MessagePrimitive.Attachments>
			</div>
			<div className="max-w-[85%] rounded-2xl bg-white/[5%] border border-white/[9%] px-4 py-2.5">
				<MessagePrimitive.Parts components={{ Text: UserTextPart }} />
			</div>
			<ActionBarPrimitive.Root
				hideWhenRunning
				autohide="always"
				className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
			>
				<CopyMessageButton />
			</ActionBarPrimitive.Root>
		</MessagePrimitive.Root>
	);
}
