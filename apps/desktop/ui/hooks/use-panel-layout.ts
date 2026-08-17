import { useCallback, useRef, useState } from "react";
import type { Layout } from "react-resizable-panels";

export function usePanelLayout(key: string): {
	defaultLayout: Layout | undefined;
	onLayoutChanged: (layout: Layout) => void;
} {
	const storageKey = `omnia:layout:v2:${key}`;

	const [defaultLayout] = useState<Layout | undefined>(() => {
		try {
			const raw = localStorage.getItem(storageKey);
			return raw ? (JSON.parse(raw) as Layout) : undefined;
		} catch {
			return undefined;
		}
	});

	const frame = useRef<number | null>(null);

	const onLayoutChanged = useCallback(
		(layout: Layout) => {
			if (frame.current !== null) cancelAnimationFrame(frame.current);
			frame.current = requestAnimationFrame(() => {
				try {
					localStorage.setItem(storageKey, JSON.stringify(layout));
				} catch {}
			});
		},
		[storageKey],
	);

	return { defaultLayout, onLayoutChanged };
}
