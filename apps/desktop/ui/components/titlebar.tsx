import { SidebarSimple } from "@phosphor-icons/react";
import { cn } from "../lib/utils";

type TitlebarProps = {
	showInspector: boolean;
	onToggleInspector: () => void;
};

export function Titlebar({ showInspector, onToggleInspector }: TitlebarProps) {
	return (
		<div
			className="flex items-center h-[38px] px-4 shrink-0 border-b border-white/[6%]"
			style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
		>
			{/* macOS traffic light placeholder */}
			<div className="flex items-center gap-[6px] mr-4">
				<span className="w-3 h-3 rounded-full bg-white/[8%]" />
				<span className="w-3 h-3 rounded-full bg-white/[8%]" />
				<span className="w-3 h-3 rounded-full bg-white/[8%]" />
			</div>

			{/* App name */}
			<div className="flex-1 flex justify-center pointer-events-none select-none">
				<span className="text-[12px] font-medium text-white/30 tracking-[0.05em]">Omnia</span>
			</div>

			{/* Controls */}
			<div
				className="flex items-center gap-1"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				<button
					onClick={onToggleInspector}
					className={cn(
						"p-1.5 rounded-md transition-colors",
						showInspector
							? "text-white/55 bg-white/[6%]"
							: "text-white/25 hover:text-white/45 hover:bg-white/[4%]",
					)}
					title="Toggle inspector"
				>
					<SidebarSimple size={14} weight="light" />
				</button>
			</div>
		</div>
	);
}
