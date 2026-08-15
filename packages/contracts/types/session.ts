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
	status: TurnStatus;
	createdAt: number;
	updatedAt: number;
};

export type TurnStatus = "in_progress" | "completed" | "failed" | "canceled";

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
