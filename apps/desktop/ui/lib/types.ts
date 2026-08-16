// Domain types for the Omnia desktop UI.
// All components and lib modules import types from here — never from App.tsx.

import type { CompleteAttachment } from "@assistant-ui/react";
export type { CompleteAttachment };

// Re-export shared contract types so component imports stay stable if the
// contracts package structure changes — update this file, not every component.
export type {
	MessageAttachment,
	Provider,
	QuoteRef,
	Session,
	SessionStatus,
	SessionView,
	SessionViewItem,
} from "@omnia/contracts";

export type InspectorEvent = {
	id: string;
	type: string;
	summary: string;
	detail?: string;
	status?: "done" | "running" | "error" | "pending";
	toolName?: string;
	input?: Record<string, unknown>;
	output?: unknown;
};

export type TurnGroup = {
	id: string;
	index: number;
	status: "done" | "running" | "failed" | "canceled";
	durationMs?: number;
	events: InspectorEvent[];
};

// Approval metadata injected into a tool-call's `args` by convert-messages.ts.
// ToolCallBlock reads these keys to detect and route approval messages.
// Both files share this type — changing the encoding means changing it once here.
export type ApprovalArgs = {
	__isApproval: true;
	__approvalId: string;
	__resolved: boolean;
	__approved: boolean | null;
	__note?: string;
};
