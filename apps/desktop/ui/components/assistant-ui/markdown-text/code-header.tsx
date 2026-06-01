import { useState } from "react";
import type { CodeHeaderProps } from "@assistant-ui/react-markdown";
import { Copy, Check } from "@phosphor-icons/react";
import { copyText } from "../../../lib/clipboard";

export function CodeHeader({ language, code }: CodeHeaderProps) {
	const [copied, setCopied] = useState(false);

	const onCopy = async () => {
		if (!code || copied) return;
		if (await copyText(code)) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<div className="flex items-center justify-between px-4 py-2 rounded-t-lg border border-b-0 border-white/[8%] bg-white/[3%]">
			<span className="text-[11px] font-mono text-white/35 lowercase">{language ?? "code"}</span>
			<button
				onClick={onCopy}
				className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/55 transition-colors"
			>
				{copied ? <Check size={11} weight="bold" /> : <Copy size={11} weight="regular" />}
				{copied ? "Copied" : "Copy"}
			</button>
		</div>
	);
}
