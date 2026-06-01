import { cn } from "../../lib/utils";

export function ActionButton({
	children,
	tooltip,
	className,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tooltip?: string }) {
	return (
		<button
			title={tooltip}
			className={cn(
				"p-1.5 rounded-lg text-white/28 hover:text-white/55 hover:bg-white/[5%] transition-colors",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}
