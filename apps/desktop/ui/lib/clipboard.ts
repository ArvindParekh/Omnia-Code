// Clipboard write with an Electron-safe fallback.
//
// `navigator.clipboard.writeText` requires a secure context and focused
// document; in the Electron renderer it can reject (or be undefined) depending
// on how the window was focused. We fall back to the legacy execCommand path so
// copy always works regardless of focus/context quirks.

export async function copyText(text: string): Promise<boolean> {
	if (!text) return false;

	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// fall through to the legacy path
		}
	}

	try {
		const el = document.createElement("textarea");
		el.value = text;
		el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
		document.body.appendChild(el);
		el.focus();
		el.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(el);
		return ok;
	} catch {
		return false;
	}
}
