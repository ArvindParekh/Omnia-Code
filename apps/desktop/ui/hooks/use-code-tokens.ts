import { useEffect, useState } from "react";
import { type BundledLanguage, codeToTokens, type ThemedToken } from "shiki";

export function useCodeTokens(code: string, language: string): ThemedToken[][] | null {
	const [tokens, setTokens] = useState<ThemedToken[][] | null>(null);

	useEffect(() => {
		if (!code) {
			setTokens(null);
			return;
		}

		let cancelled = false;

		codeToTokens(code, { lang: language as BundledLanguage, theme: "github-dark-dimmed" })
			.then((result) => {
				if (!cancelled) setTokens(result.tokens);
			})
			.catch(() => {
				if (!cancelled) setTokens(null);
			});

		return () => {
			cancelled = true;
		};
	}, [code, language]);

	return tokens;
}
