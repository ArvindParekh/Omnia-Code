import { SidebarSimple, Sun, Moon, X, Minus, Plus } from "@phosphor-icons/react";
import { cn } from "../lib/utils";

type TitlebarProps = {
	showInspector: boolean;
	onToggleInspector: () => void;
	isDark: boolean;
	onToggleTheme: () => void;
};

export function Titlebar({
	showInspector,
	onToggleInspector,
	isDark,
	onToggleTheme,
}: TitlebarProps) {
	return (
		<div
			className="flex items-center h-[38px] px-4 shrink-0 border-b border-white/[6%]"
			style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
		>
			{/* macOS traffic lights */}
			<div
				className="flex items-center gap-[6px] mr-4 group"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				<button
					onClick={() => window.omnia.ipc.invoke("window:close", {})}
					className="w-3 h-3 rounded-full bg-[#FF5F57] flex items-center justify-center"
					title="Close"
				>
					<X
						size={7}
						weight="bold"
						className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
					/>
				</button>
				<button
					onClick={() => window.omnia.ipc.invoke("window:minimize", {})}
					className="w-3 h-3 rounded-full bg-[#FFBD2E] flex items-center justify-center"
					title="Minimize"
				>
					<Minus
						size={7}
						weight="bold"
						className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
					/>
				</button>
				<button
					onClick={() => window.omnia.ipc.invoke("window:maximize", {})}
					className="w-3 h-3 rounded-full bg-[#28C840] flex items-center justify-center"
					title="Maximize"
				>
					<Plus
						size={7}
						weight="bold"
						className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
					/>
				</button>
			</div>

			{/* App name */}
			<div className="flex-1 flex justify-center pointer-events-none select-none">
				<span className="text-[11px] font-medium text-white/30 tracking-[0.05em]">Omnia</span>
			</div>

			{/* Controls */}
			<div
				className="flex items-center gap-1"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				<button
					onClick={onToggleTheme}
					className="p-1.5 rounded-md text-white/25 hover:text-white/45 hover:bg-white/[4%] transition-colors"
					title={isDark ? "Switch to light mode" : "Switch to dark mode"}
				>
					{isDark ? <Sun size={14} weight="light" /> : <Moon size={14} weight="light" />}
				</button>
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
