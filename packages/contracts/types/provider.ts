type Provider = "gemini" | "claude" | "codex" | "opencode" | "cursor" | "fake";

type ProviderAvailability = {
  provider: Provider;
  status: "available" | "missing" | "needs_auth" | "error";
  label: string;
  detail?: string;
  detectedVersion?: string;
}

type ProviderRuntimeEvent = {
  type: "assistant.delta";
  text: string;
} | { type: "assistant.completed" } | {
  type: "tool.started";
  toolCallId: string;
  toolName: string;
  input: unknown;
  risk: ToolRisk;
} | { type: "tool.completed"; toolCallId: string; output: unknown; isError: boolean }
  | { type: "approval.requested"; approvalId: string; toolCallId: string; toolName: string; input: unknown; risk: ToolRisk }
  | { type: "runtime.failed"; message: string; retryable: boolean; providerCorrelationId?: string };

enum ToolRisk {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

type SessionStatus = "idle" | "running" | "error";

type SessionPolicy = {
  capabilities: Capability[];
}

type Capability = {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

type MessageAttachment = {
  id: string;
  kind: "file" | "image" | "text";
  path: string;
  contentType?: string;
  sizeBytes?: number;
};

type Session = {
  id: string;
  provider: Provider;
  title: string;
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
};

type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | {
    type: "error";
    message: string;
    retryable?: boolean;
    correlationId?: string;
  }
  | { type: "approval"; id: string; toolName: string; input: unknown };

type IpcChannels = {
  "agent:createSession": {
    args: {
      provider: Provider;
    };
    result: Promise<Session>;
  };
  "agent:sendMessage": {
    args: {
      sessionId: string;
      message: string;
    };
    result: void;
  };
  "agent:confirm": {
    args: {
      sessionId: string;
      toolCallId: string;
      approved: boolean;
    };
    result: void;
  };
  "agent:getSessions": {
    args: Record<string, never>;
    result: Session[];
  };
  "agent:getEvents": {
    args: {
      sessionId: string;
    };
    result: AgentEvent[];
  };
  "agent:detectProviders": {
    args: Record<string, never>;
    result: Provider[];
  };
};

type IpcEvents = {
  "agent:event": { sessionId: string; event: AgentEvent };
  "agent:sessionUpdated": { session: Session };
};

export type { Provider, ProviderAvailability, ProviderRuntimeEvent, ToolRisk, SessionPolicy, Capability, MessageAttachment, Session, AgentEvent, IpcChannels, IpcEvents };
