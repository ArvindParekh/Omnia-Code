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

type Approval = {
  id: string;
  toolCallId: string;
  turnId: string;
  sessionId: string;
  approved: boolean;
}

export type { Provider, ProviderAvailability, ProviderRuntimeEvent, ToolRisk, Capability, MessageAttachment, Approval };
