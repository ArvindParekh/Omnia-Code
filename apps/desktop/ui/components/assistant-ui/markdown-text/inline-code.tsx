import { type ComponentPropsWithoutRef } from "react";
import { useIsMarkdownCodeBlock } from "@assistant-ui/react-markdown";
import { cn } from "../../../lib/utils";

export function InlineCode({ className, ...props }: ComponentPropsWithoutRef<"code">) {
	const isCodeBlock = useIsMarkdownCodeBlock();
	if (isCodeBlock) return <code className={className} {...props} />;
	return (
		<code
			className={cn(
				"rounded-md border border-white/[8%] bg-white/[5%] px-1.5 py-0.5 font-mono text-[0.85em] text-white/70",
				className,
			)}
			{...props}
		/>
	);
}
