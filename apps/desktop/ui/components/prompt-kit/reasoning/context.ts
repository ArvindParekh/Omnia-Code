import { createContext, useContext } from "react";

export type ReasoningCtxValue = { open: boolean; setOpen: (v: boolean) => void };

export const ReasoningCtx = createContext<ReasoningCtxValue | null>(null);

export function useReasoningCtx() {
	const ctx = useContext(ReasoningCtx);
	if (!ctx) throw new Error("Must be inside <Reasoning>");
	return ctx;
}
