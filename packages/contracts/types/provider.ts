type Provider = "gemini" | "claude" | "codex" | "opencode" | "cursor" | "fake";

type EffortLevel = "low" | "medium" | "high" | "xhigh" | "max";

type ModelSelection = { mode: "provider_default" } | { mode: "explicit"; modelId: string };

type ModelInfo = {
	/**
	 * Model identifier to use in API calls
	 */
	value: string;
	/**
	 * Human-readable display name
	 */
	displayName: string;
	/**
	 * Description of the model's capabilities
	 */
	description: string;
	/**
	 * Whether this model supports effort levels
	 */
	supportsEffort?: boolean;
	/**
	 * Available effort levels for this model
	 */
	supportedEffortLevels?: ("low" | "medium" | "high" | "xhigh" | "max")[];
	/**
	 * Whether this model supports adaptive thinking (Claude decides when and how much to think)
	 */
	supportsAdaptiveThinking?: boolean;
	/**
	 * Whether this model supports fast mode
	 */
	supportsFastMode?: boolean;
	/**
	 * Whether this model supports auto mode
	 */
	supportsAutoMode?: boolean;
};

type ProviderModelCapabilities = {
	provider: Provider;
	selectionSupported: boolean;
	discoveredModels: ModelInfo[];
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
			blockId: string;
			text: string;
	  }
	| { type: "assistant.completed"; blockId: string }
	| {
			type: "reasoning.delta";
			blockId: string;
			text: string;
	  }
	| {
			type: "session.titleSuggested";
			title: string;
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
	EffortLevel,
	MessageAttachment,
	ModelInfo,
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
