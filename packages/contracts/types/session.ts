import type { Provider, Capability } from "./provider";

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
}

export enum TurnStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

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

  export type SessionPolicy = {
    capabilities: Capability[];
  }
