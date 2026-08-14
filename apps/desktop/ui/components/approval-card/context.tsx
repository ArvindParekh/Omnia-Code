import { createContext, useContext } from "react";

type ApprovalContextValue = {
	onApprove: (id: string, approved: boolean, note?: string) => void;
};

export const ApprovalContext = createContext<ApprovalContextValue | null>(null);

export function useApproval() {
	const ctx = useContext(ApprovalContext);
	if (!ctx) throw new Error("useApproval must be used inside ApprovalContext.Provider");
	return ctx;
}
