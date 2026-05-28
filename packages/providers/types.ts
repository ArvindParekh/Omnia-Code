import type { Provider, ProviderAvailability, ProviderRuntimeEvent, SessionPolicy, ToolRisk, MessageAttachment, Capability } from "@omnia/contracts";

type ProviderAdapter = {
    readonly provider: Provider;

    detect(): Promise<ProviderAvailability>;

    createSession(input: CreateProviderSessionInput): Promise<ProviderSessionRef>;

    resumeSession(input: ResumeProviderSessionInput): Promise<void>;

    sendTurn(input: SendProviderTurnInput): AsyncIterable<ProviderRuntimeEvent>;

    cancelTurn(input: CancelProviderTurnInput): Promise<void>;

    resolveApproval(input: ResolveProviderApprovalInput): Promise<void>;

    disposeSession(input: DisposeProviderSessionInput): Promise<void>;
}

type CreateProviderSessionInput = {
    sessionId: string;
    workspacePath: string;
    policy: SessionPolicy;
}

type ProviderSessionRef = {
    sessionId: string;
    provider: Provider;
    externalId?: string;
    stateJson?: unknown;
};

type ResumeProviderSessionInput = {
    sessionId: string;
}

type SendProviderTurnInput = {
    sessionId: string;
    providerSessionRef: ProviderSessionRef;
    turnId: string;
    text: string;
    attachments: MessageAttachment[];
    workspacePath: string;
    policy: SessionPolicy;
    signal: AbortSignal;
}


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

export type { ProviderAdapter, CreateProviderSessionInput, ProviderSessionRef, ResumeProviderSessionInput, SendProviderTurnInput, SessionPolicy, Capability, MessageAttachment, CancelProviderTurnInput, ResolveProviderApprovalInput, DisposeProviderSessionInput };