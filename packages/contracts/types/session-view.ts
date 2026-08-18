import type { EffortLevel, MessageAttachment, QuoteRef, ToolRisk } from "./provider.ts";

export type SessionViewItem =
	| {
			kind: "user";
			id: string;
			turnId: string;
			text: string;
			quote?: QuoteRef;
			attachments: MessageAttachment[];
			createdAt: number;
	  }
	| {
			kind: "assistant";
			id: string;
			turnId: string;
			text: string;
			streaming: boolean;
			createdAt: number;
	  }
	| {
			kind: "reasoning";
			id: string;
			turnId: string;
			text: string;
			streaming: boolean;
			createdAt: number;
	  }
	| {
			kind: "tool";
			id: string;
			turnId: string;
			name: string;
			input: unknown;
			risk: ToolRisk;
			status: "running" | "done" | "error";
			output?: unknown;
			createdAt: number;
	  }
	| {
			kind: "approval";
			id: string;
			turnId: string;
			toolCallId: string;
			toolName: string;
			input: unknown;
			risk: ToolRisk;
			resolved: boolean;
			approved?: boolean;
			note?: string;
			createdAt: number;
			resolvedAt?: number;
	  }
	| {
			kind: "model";
			id: string;
			turnId: string;
			modelId: string;
			effort?: EffortLevel;
			createdAt: number;
	  }
	| {
			kind: "error";
			id: string;
			turnId: string;
			message: string;
			retryable: boolean;
			correlationId?: string;
			createdAt: number;
	  };

export type SessionView = {
	sessionId: string;
	items: SessionViewItem[];
	lastSeq: number;
};
