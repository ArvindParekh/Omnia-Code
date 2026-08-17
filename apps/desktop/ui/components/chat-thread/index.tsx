import { SelectionToolbarPrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { ArrowDown, Quotes } from "@phosphor-icons/react";
import type { Session } from "../../lib/types";
import { providerLabel } from "../../lib/provider";
import { SpinnerGap } from "@phosphor-icons/react";
import { Composer } from "./composer";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";

export function ChatThread({ session, isCanceling }: { session: Session; isCanceling: boolean }) {
	const label = providerLabel(session.provider);
	const workspaceBase = session.workspaceId.replace(/^.*\//, "") || session.workspaceId;
	const [messagesRef] = useAutoAnimate<HTMLDivElement>();

	return (
		<ThreadPrimitive.Root className="flex flex-col flex-1 overflow-hidden">
			<div className="flex items-center gap-3 px-5 py-3 border-b border-white/[6%] shrink-0">
				<span className="text-[12px] font-medium text-white/80 truncate">{session.title}</span>
				<span className="text-[10px] text-white/25 shrink-0 hidden sm:block">
					{label} &middot; {workspaceBase}
				</span>
				{session.status === "running" && (
					<div className="ml-auto flex items-center gap-1.5 text-white/30">
						<SpinnerGap size={13} weight="bold" className="animate-spin shrink-0" />
						{isCanceling && <span className="text-[10px]">canceling</span>}
					</div>
				)}
				{session.status === "error" && (
					<span className="ml-auto text-[10px] text-red-400/50 shrink-0">failed</span>
				)}
			</div>

			<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
				<div className="flex flex-col min-h-full">
					<ThreadPrimitive.Empty>
						<div className="flex flex-col items-center justify-center flex-1 gap-2 py-20">
							<p className="text-[12px] text-white/25">Ask {label} anything</p>
						</div>
					</ThreadPrimitive.Empty>

					<div
						ref={messagesRef}
						className="flex flex-col px-5 py-6 gap-7 max-w-[700px] mx-auto w-full"
					>
						<ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
					</div>

					<ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto bg-[var(--background)]">
						<div className="max-w-[700px] mx-auto w-full px-5 pb-5 pt-2 relative">
							<ThreadPrimitive.ScrollToBottom asChild>
								<button
									className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5
										px-3 py-1.5 rounded-full bg-[var(--surface)] border border-white/[10%]
										text-[10px] text-white/45 hover:text-white/65 hover:bg-[var(--surface-raised)]
										transition-all shadow-lg
										disabled:opacity-0 disabled:pointer-events-none"
								>
									<ArrowDown size={11} weight="bold" />
									Latest
								</button>
							</ThreadPrimitive.ScrollToBottom>

							<Composer
								label={label}
								workspaceId={session.workspaceId}
								provider={session.provider}
								isCanceling={isCanceling}
							/>
						</div>
					</ThreadPrimitive.ViewportFooter>
				</div>
			</ThreadPrimitive.Viewport>

			<SelectionToolbarPrimitive.Root className="z-50 flex items-center gap-1 rounded-lg border border-white/[10%] bg-[var(--surface-raised)] px-2 py-1.5 shadow-xl">
				<SelectionToolbarPrimitive.Quote asChild>
					<button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-white/50 hover:text-white/75 hover:bg-white/[5%] transition-colors">
						<Quotes size={12} weight="light" />
						Quote
					</button>
				</SelectionToolbarPrimitive.Quote>
			</SelectionToolbarPrimitive.Root>
		</ThreadPrimitive.Root>
	);
}
