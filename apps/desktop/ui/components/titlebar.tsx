import { SidebarSimple } from "@phosphor-icons/react";

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
				<span className="w-[11px] h-[11px] rounded-full bg-white/[10%]" />
				<span className="w-[11px] h-[11px] rounded-full bg-white/[10%]" />
				<span className="w-[11px] h-[11px] rounded-full bg-white/[10%]" />
			</div>

			{/* App name */}
			<div className="flex-1 flex justify-center pointer-events-none">
				<span className="text-[12px] font-medium text-white/30 tracking-[0.04em]">Omnia</span>
			</div>

			{/* Right controls */}
			<div
				className="flex items-center gap-1"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				<button
					onClick={onToggleInspector}
					className={`p-1.5 rounded-md transition-colors duration-150
						${showInspector ? "text-white/55 bg-white/[6%]" : "text-white/25 hover:text-white/45 hover:bg-white/[4%]"}`}
					title="Toggle event inspector"
				>
					<SidebarSimple size={14} />
				</button>
			</div>
		</div>
	);
}
