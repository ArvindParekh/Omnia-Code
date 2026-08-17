import { CircleDashed, Cube, Sparkle, Terminal } from "@phosphor-icons/react";
import type { Provider } from "../lib/types";
import { cn } from "../lib/utils";

// Arm angles (degrees) and outer radii for Claude's burst mark. The uneven
// lengths are what make it read as the logo rather than a generic asterisk.
const CLAUDE_ARMS: [number, number][] = [
	[0, 9.6],
	[31, 8.2],
	[59, 10.2],
	[88, 8.4],
	[118, 9.9],
	[147, 8.1],
	[180, 9.6],
	[211, 8.2],
	[239, 10.2],
	[268, 8.4],
	[298, 9.9],
	[327, 8.1],
];

function ClaudeMark({ size, className }: { size: number; className?: string }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			role="img"
			aria-label="Claude"
			className={className}
		>
			<title>Claude</title>
			{CLAUDE_ARMS.map(([angle, outer]) => {
				const radians = (angle * Math.PI) / 180;
				const inner = 2.4;
				return (
					<line
						key={angle}
						x1={12 + Math.cos(radians) * inner}
						y1={12 + Math.sin(radians) * inner}
						x2={12 + Math.cos(radians) * outer}
						y2={12 + Math.sin(radians) * outer}
						stroke="currentColor"
						strokeWidth={2.4}
						strokeLinecap="round"
					/>
				);
			})}
		</svg>
	);
}

const PROVIDER_TINT: Record<Provider, string> = {
	claude: "text-[#D97757]",
	gemini: "text-[#4285F4]",
	codex: "text-white/70",
	cursor: "text-white/70",
	opencode: "text-[#57A773]",
	fake: "text-white/30",
};

export function ProviderIcon({
	provider,
	size = 13,
	className,
	muted,
}: {
	provider: Provider;
	size?: number;
	className?: string;
	muted?: boolean;
}) {
	const tint = muted ? "text-white/30" : PROVIDER_TINT[provider];

	if (provider === "claude") {
		return <ClaudeMark size={size} className={cn("shrink-0", tint, className)} />;
	}

	const Fallback =
		provider === "gemini"
			? Sparkle
			: provider === "fake"
				? CircleDashed
				: provider === "codex"
					? Terminal
					: Cube;

	return <Fallback size={size} weight="fill" className={cn("shrink-0", tint, className)} />;
}
