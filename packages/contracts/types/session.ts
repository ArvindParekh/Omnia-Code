import type { Capability, Provider } from "./provider.ts";

export type Session = {
	id: string;
	provider: Provider;
	title: string;
	status: SessionStatus;
	workspaceId: string;
	metadata?: Record<string, unknown>;
	createdAt: number;
	updatedAt: number;
};

export type Turn = {
	id: string;
	sessionId: string;
	userMessage: string;
	agentEvents: AgentEvent[];
	status: TurnStatus;
	createdAt: number;
	updatedAt: number;
};

export type TurnStatus = "in_progress" | "completed" | "failed" | "canceled";

export type AgentEvent =
	| { type: "delta"; text: string }
	| { type: "done" }
	| {
			type: "error";
			message: string;
			retryable?: boolean;
			correlationId?: string;
	  }
	| { type: "approval"; id: string; toolName: string; input: unknown };

export type SessionStatus = "idle" | "running" | "error";

export type ProviderSessionRef = {
	sessionId: string;
	provider: Provider;
	externalId?: string;
	stateJson?: unknown;
};

export type SessionPolicy = {
	capabilities: Capability[];
};
