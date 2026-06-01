// Domain types for the Omnia desktop UI.
// All components and lib modules import types from here — never from App.tsx.

import type { CompleteAttachment } from "@assistant-ui/react";
export type { CompleteAttachment };

// Re-export shared contract types so component imports stay stable if the
// contracts package structure changes — update this file, not every component.
export type { Provider, Session, SessionStatus } from "@omnia/contracts";

// A quote carried on a user message — the snippet the user selected from a
// prior assistant response before sending. Mirrors assistant-ui's QuoteInfo,
// which lives at message.metadata.custom.quote.
export type QuoteRef = {
	text: string;
	messageId: string;
};

export type ChatMessage =
	| {
			kind: "user";
			id: string;
			text: string;
			quote?: QuoteRef;
			attachments?: CompleteAttachment[];
			timestamp: Date;
	  }
	| { kind: "assistant"; id: string; text: string; streaming?: boolean; timestamp: Date }
	| { kind: "reasoning"; id: string; text: string; timestamp: Date }
	| {
			kind: "tool";
			id: string;
			name: string;
			input: Record<string, unknown>;
			status: "running" | "done" | "error";
			output?: string;
			timestamp: Date;
	  }
	| {
			kind: "approval";
			id: string;
			toolName: string;
			input: Record<string, unknown>;
			resolved: boolean;
			approved?: boolean;
			timestamp: Date;
	  }
	| { kind: "error"; id: string; message: string; timestamp: Date };

export type InspectorEvent = {
	id: string;
	type: string;
	summary: string;
	detail?: string;
	status?: "done" | "running" | "error" | "pending";
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
};
