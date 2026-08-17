import type { EffortLevel, ModelInfo } from "@omnia/contracts";
import {
	CaretUpDown,
	Check,
	CircleDashed,
	Feather,
	type Icon,
	Lightning,
	Sparkle,
} from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const MODEL_ICONS: Record<string, Icon> = {
	opus: Sparkle,
	sonnet: Lightning,
	haiku: Feather,
};

const EFFORT_LABELS: Record<EffortLevel, string> = {
	low: "Low",
	medium: "Med",
	high: "High",
	xhigh: "X-High",
	max: "Max",
};

function iconFor(model: ModelInfo): Icon {
	const key = Object.keys(MODEL_ICONS).find((name) => model.value.includes(name));
	return key ? (MODEL_ICONS[key] as Icon) : CircleDashed;
}

export function ModelPicker({
	models,
	modelId,
	effort,
	onModelChange,
	onEffortChange,
	disabled,
	align = "start",
	side = "top",
}: {
	models: ModelInfo[];
	modelId: string | null;
	effort: EffortLevel | null;
	onModelChange: (modelId: string) => void;
	onEffortChange: (effort: EffortLevel | null) => void;
	disabled?: boolean;
	align?: "start" | "center" | "end";
	side?: "top" | "bottom";
}) {
	const [open, setOpen] = useState(false);

	if (models.length === 0) return null;

	const selected = models.find((model) => model.value === modelId) ?? models[0];
	if (!selected) return null;

	const TriggerIcon = iconFor(selected);
	const efforts = selected.supportsEffort ? (selected.supportedEffortLevels ?? []) : [];
	const activeEffort = effort && efforts.includes(effort) ? effort : null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					disabled={disabled}
					className={cn(
						"group flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors",
						"text-white/45 hover:bg-white/[7%] hover:text-white/75",
						"data-[state=open]:bg-white/[7%] data-[state=open]:text-white/75",
						"disabled:pointer-events-none disabled:opacity-40",
					)}
				>
					<TriggerIcon
						size={12}
						weight="fill"
						className="text-white/35 group-hover:text-white/60"
					/>
					<span className="text-[10px] font-medium">{selected.displayName}</span>
					{activeEffort && (
						<span className="font-mono text-[9px] text-white/28">
							{EFFORT_LABELS[activeEffort]}
						</span>
					)}
					<CaretUpDown size={9} weight="bold" className="text-white/25" />
				</button>
			</PopoverTrigger>

			<PopoverContent align={align} side={side} className="w-[268px] p-0">
				<div className="flex flex-col p-1">
					{models.map((model) => {
						const ModelIcon = iconFor(model);
						const isSelected = model.value === selected.value;

						return (
							<button
								key={model.value}
								type="button"
								onClick={() => {
									onModelChange(model.value);
									if (!model.supportsEffort) onEffortChange(null);
									setOpen(false);
								}}
								className={cn(
									"flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
									isSelected ? "bg-white/[6%]" : "hover:bg-white/[4%]",
								)}
							>
								<ModelIcon
									size={13}
									weight="fill"
									className={cn("mt-0.5 shrink-0", isSelected ? "text-white/60" : "text-white/28")}
								/>
								<span className="flex min-w-0 flex-1 flex-col gap-0.5">
									<span
										className={cn(
											"text-[11px] font-medium",
											isSelected ? "text-white/85" : "text-white/60",
										)}
									>
										{model.displayName}
									</span>
									{model.description && (
										<span className="text-[10px] leading-snug text-white/28">
											{model.description}
										</span>
									)}
								</span>
								{isSelected && (
									<Check size={11} weight="bold" className="mt-0.5 shrink-0 text-white/50" />
								)}
							</button>
						);
					})}
				</div>

				{efforts.length > 0 && (
					<div className="border-t border-white/[7%] p-2.5">
						<div className="mb-1.5 flex items-baseline justify-between">
							<span className="text-[9px] font-semibold tracking-[0.1em] text-white/25 uppercase">
								Effort
							</span>
							<span className="text-[9px] text-white/20">
								{activeEffort ? "" : "provider default"}
							</span>
						</div>
						<div className="flex gap-0.5 rounded-lg bg-white/[4%] p-0.5">
							{efforts.map((level) => (
								<button
									key={level}
									type="button"
									onClick={() => onEffortChange(activeEffort === level ? null : level)}
									className={cn(
										"flex-1 rounded-md px-1 py-1 text-[9.5px] font-medium transition-colors",
										activeEffort === level
											? "bg-white/[11%] text-white/85"
											: "text-white/35 hover:text-white/60",
									)}
								>
									{EFFORT_LABELS[level]}
								</button>
							))}
						</div>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
