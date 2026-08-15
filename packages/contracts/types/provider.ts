type Provider = "gemini" | "claude" | "codex" | "opencode" | "cursor" | "fake";

type ModelSelection = { mode: "provider_default" } | { mode: "explicit"; modelId: string };

type ModelDescriptor = {
	id: string;
	label: string;
	description?: string;
};

type ProviderModelCapabilities = {
	provider: Provider;
	selectionSupported: boolean;
	discoveredModels: ModelDescriptor[];
	discoveredAt: number;
};

type ProviderAvailability = {
	provider: Provider;
	status: "available" | "missing" | "needs_auth" | "error";
	label: string;
	detail?: string;
	detectedVersion?: string;
};

type ProviderRuntimeEvent =
	| {
			type: "assistant.delta";
			text: string;
	  }
	| { type: "assistant.completed" }
	| {
			type: "reasoning.delta";
			text: string;
	  }
	| {
			type: "tool.started";
			toolCallId: string;
			toolName: string;
			input: unknown;
			risk: ToolRisk;
	  }
	| {
			type: "tool.completed";
			toolCallId: string;
			output: unknown;
			isError: boolean;
	  }
	| {
			type: "approval.requested";
			approvalId: string;
			toolCallId: string;
			toolName: string;
			input: unknown;
			risk: ToolRisk;
	  }
	| {
			type: "runtime.failed";
			message: string;
			retryable: boolean;
			providerCorrelationId?: string;
	  };

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
};

type MessageAttachment = {
	id: string;
	kind: "file" | "image" | "text";
	path: string;
	name: string;
	contentType?: string;
	sizeBytes?: number;
};

type QuoteRef = {
	text: string;
	messageId: string;
};

type Approval = {
	id: string;
	toolCallId: string;
	turnId: string;
	sessionId: string;
	approved: boolean;
};

export type {
	Approval,
	Capability,
	MessageAttachment,
	ModelDescriptor,
	ModelSelection,
	Provider,
	ProviderAvailability,
	QuoteRef,
	ProviderModelCapabilities,
	ProviderRuntimeEvent,
};

// ToolRisk is a real enum (not a string-literal union) — it needs a value
// export too, or consumers can never construct one, only annotate with it.
export { ToolRisk };
