import type {
	Capability,
	MessageAttachment,
	Provider,
	ProviderAvailability,
	ProviderRuntimeEvent,
	QuoteRef,
	SessionPolicy,
	ToolRisk,
	ProviderSessionRef,
} from "@omnia/contracts";

type ProviderAdapter = {
	readonly provider: Provider;

	// detects if the provider is available and returns its availability
	detect(): Promise<ProviderAvailability>;

	// creates a new session with the provider
	createSession(input: CreateProviderSessionInput): Promise<ProviderSessionRef>;

	// renames an existing session with the provider
	renameSession(input: RenameProviderSessionInput): Promise<void>;

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

type RenameProviderSessionInput = {
	sessionId: string;
	providerSessionRef: ProviderSessionRef;
	customTitle: string;
};

type CreateProviderSessionInput = {
	sessionId: string;
	workspacePath: string;
	policy: SessionPolicy;
};

type ResumeProviderSessionInput = {
	sessionId: string;
	providerSessionRef: ProviderSessionRef;
	workspacePath: string;
	policy: SessionPolicy;
};

type SendProviderTurnInput = {
	sessionId: string;
	providerSessionRef: ProviderSessionRef;
	turnId: string;
	text: string;
	attachments: MessageAttachment[];
	quote?: QuoteRef;
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
	ResolveProviderApprovalInput,
	ResumeProviderSessionInput,
	SendProviderTurnInput,
	RenameProviderSessionInput,
};
