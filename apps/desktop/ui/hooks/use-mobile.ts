import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
	// Lazy initializer reads window synchronously so we never need to call
	// setState in the effect body (which react-hooks/set-state-in-effect disallows).
	const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return isMobile;
}
