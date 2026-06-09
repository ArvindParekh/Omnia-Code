import type {
	Capability,
	MessageAttachment,
	Provider,
	ProviderAvailability,
	ProviderRuntimeEvent,
	SessionPolicy,
	ToolRisk,
} from "@omnia/contracts";

type ProviderAdapter = {
	readonly provider: Provider;

	// detects if the provider is available and returns its availability
	detect(): Promise<ProviderAvailability>;

	// creates a new session with the provider
	createSession(input: CreateProviderSessionInput): Promise<ProviderSessionRef>;

	// resumes an existing session with the provider
	resumeSession(input: ResumeProviderSessionInput): Promise<void>;

	// sends a turn to the provider
	sendTurn(input: SendProviderTurnInput): AsyncIterable<ProviderRuntimeEvent>;

	// cancels an ongoing turn for the provider
	cancelTurn(input: CancelProviderTurnInput): Promise<void>;

	// resolves the approval of a tool call for the provider
	resolveApproval(input: ResolveProviderApprovalInput): Promise<void>;

	// disposes off a session with the provider
	disposeSession(input: DisposeProviderSessionInput): Promise<void>;
};

type CreateProviderSessionInput = {
	sessionId: string;
	workspacePath: string;
	policy: SessionPolicy;
};

type ProviderSessionRef = {
	sessionId: string;
	provider: Provider;
	externalId?: string;
	stateJson?: unknown;
};

type ResumeProviderSessionInput = {
	sessionId: string;
};

type SendProviderTurnInput = {
	sessionId: string;
	providerSessionRef: ProviderSessionRef;
	turnId: string;
	text: string;
	attachments: MessageAttachment[];
	workspacePath: string;
	policy: SessionPolicy;
	resume: boolean;
	signal: AbortSignal;
};

type CancelProviderTurnInput = {
	sessionId: string;
	providerSessionRef: ProviderSessionRef;
	turnId: string;
	workspacePath: string;
	policy: SessionPolicy;
	signal: AbortSignal;
};

type ResolveProviderApprovalInput = {
	sessionId: string;
	providerSessionRef: ProviderSessionRef;
	turnId: string;
	toolCallId: string;
	toolName: string;
	input: unknown;
	risk: ToolRisk;
	approved: boolean;
	note?: unknown;
};

type DisposeProviderSessionInput = {
	sessionId: string;
	providerSessionRef: ProviderSessionRef;
};

export type {
	CancelProviderTurnInput,
	Capability,
	CreateProviderSessionInput,
	DisposeProviderSessionInput,
	MessageAttachment,
	ProviderAdapter,
	ProviderSessionRef,
	ResolveProviderApprovalInput,
	ResumeProviderSessionInput,
	SendProviderTurnInput,
	SessionPolicy,
};
