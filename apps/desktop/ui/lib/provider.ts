import type { Provider } from "../App";

export function providerColor(provider: Provider): string {
	const map: Record<Provider, string> = {
		claude: "#d97706",
		gemini: "#3b82f6",
		codex: "#10b981",
		opencode: "#7c3aed",
		cursor: "#6366f1",
		fake: "#71717a",
	};
	return map[provider] ?? "#71717a";
}

export function providerLabel(provider: Provider): string {
	const map: Record<Provider, string> = {
		claude: "claude",
		gemini: "gemini",
		codex: "codex",
		opencode: "opencode",
		cursor: "cursor",
		fake: "fake",
	};
	return map[provider] ?? provider;
}
