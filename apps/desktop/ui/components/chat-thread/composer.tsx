import { ComposerPrimitive, useThread } from "@assistant-ui/react";
import { ArrowUp, FolderSimple, Paperclip, SpinnerGap, X } from "@phosphor-icons/react";
import type { EffortLevel, Provider } from "../../lib/types";
import { providerLabel } from "../../lib/provider";
import { useProviderModels } from "../../hooks/use-provider-models";
import { ModelPicker } from "../model-picker";
import { Quotes } from "@phosphor-icons/react";

type ComposerProps = {
	label: string;
	workspaceId: string;
	provider: Provider;
	isCanceling: boolean;
	modelId: string | null;
	onModelChange: (modelId: string) => void;
	effort: EffortLevel | null;
	onEffortChange: (effort: EffortLevel | null) => void;
};

export function Composer({
	label,
	workspaceId,
	provider,
	isCanceling,
	modelId,
	onModelChange,
	effort,
	onEffortChange,
}: ComposerProps) {
	const isRunning = useThread((thread) => thread.isRunning);
	const workspaceBase = workspaceId.replace(/^.*\//, "") || workspaceId;
	const { models, selectionSupported } = useProviderModels(provider);

	return (
		<ComposerPrimitive.Root
			className="rounded-2xl border border-white/[9%] bg-white/[3%] overflow-hidden
				focus-within:border-white/[16%] focus-within:bg-white/[4%] transition-all"
		>
			<ComposerPrimitive.Quote className="flex items-start gap-2 px-4 pt-3 pb-0">
				<div className="flex-1 flex items-start gap-2 rounded-lg border border-white/[8%] bg-white/[3%] px-3 py-2">
					<Quotes size={11} weight="fill" className="text-white/30 shrink-0 mt-0.5" />
					<ComposerPrimitive.QuoteText className="flex-1 text-[11px] text-white/45 font-mono leading-relaxed line-clamp-2" />
				</div>
				<ComposerPrimitive.QuoteDismiss asChild>
					<button className="mt-2 p-0.5 text-white/30 hover:text-white/55 transition-colors shrink-0">
						<X size={11} weight="bold" />
					</button>
				</ComposerPrimitive.QuoteDismiss>
			</ComposerPrimitive.Quote>

			<div className="flex flex-wrap gap-1.5 px-4 pt-2 empty:hidden">
				<ComposerPrimitive.Attachments>
					{({ attachment }) => (
						<div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-white/[8%] bg-white/[3%] text-[10px] text-white/45">
							<Paperclip size={10} weight="light" />
							<span className="max-w-[120px] truncate">{attachment.name}</span>
						</div>
					)}
				</ComposerPrimitive.Attachments>
			</div>

			<div className="px-4 pt-3.5 pb-2">
				<ComposerPrimitive.Input
					placeholder={`Ask ${label}...`}
					rows={1}
					className="w-full bg-transparent text-[12px] text-white/80 placeholder:text-white/25
						resize-none outline-none leading-[1.6] select-text"
				/>
			</div>

			<div className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-white/[5%]">
				<ComposerPrimitive.AddAttachment asChild>
					<button className="p-1.5 rounded-lg text-white/28 hover:text-white/55 hover:bg-white/[5%] transition-colors">
						<Paperclip size={13} weight="light" />
					</button>
				</ComposerPrimitive.AddAttachment>

				{selectionSupported ? (
					<ModelPicker
						models={models}
						modelId={modelId}
						effort={effort}
						onModelChange={onModelChange}
						onEffortChange={onEffortChange}
					/>
				) : (
					<span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[6%] text-white/40 font-mono">
						{providerLabel(provider)}
					</span>
				)}

				<div className="flex items-center gap-1 text-white/22">
					<FolderSimple size={12} weight="light" />
					<span className="text-[10px] font-mono">{workspaceBase}</span>
				</div>

				<div className="ml-auto">
					{isRunning ? (
						<ComposerPrimitive.Cancel asChild>
							<button
								disabled={isCanceling}
								aria-label={isCanceling ? "Canceling response" : "Cancel response"}
								className="w-8 h-8 rounded-full bg-white/[8%] border border-white/[12%] flex items-center justify-center hover:bg-white/[14%] disabled:cursor-wait disabled:opacity-60 transition-colors"
							>
								{isCanceling ? (
									<SpinnerGap size={13} weight="bold" className="text-white/60 animate-spin" />
								) : (
									<X size={13} weight="bold" className="text-white/60" />
								)}
							</button>
						</ComposerPrimitive.Cancel>
					) : (
						<ComposerPrimitive.Send asChild>
							<button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed hover:opacity-85 transition-all">
								<ArrowUp size={14} weight="bold" className="text-primary-foreground" />
							</button>
						</ComposerPrimitive.Send>
					)}
				</div>
			</div>
		</ComposerPrimitive.Root>
	);
}
