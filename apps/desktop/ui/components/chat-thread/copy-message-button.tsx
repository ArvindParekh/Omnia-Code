import { useState } from "react";
import { useMessage } from "@assistant-ui/react";
import { Check, Copy } from "@phosphor-icons/react";
import { copyText } from "../../lib/clipboard";
import { ActionButton } from "./action-button";

export function CopyMessageButton() {
	const [copied, setCopied] = useState(false);
	const message = useMessage();

	const handleCopy = async () => {
		const text = message.content
			.filter((p) => p.type === "text")
			.map((p) => (p as { type: "text"; text: string }).text)
			.join("\n\n");
		if (await copyText(text)) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<ActionButton onClick={handleCopy} tooltip="Copy">
			{copied ? (
				<Check size={11} weight="bold" className="text-white/55" />
			) : (
				<Copy size={11} weight="regular" />
			)}
		</ActionButton>
	);
}
