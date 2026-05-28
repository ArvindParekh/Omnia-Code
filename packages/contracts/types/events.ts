import type { MessageAttachment, Provider, ToolRisk } from "./provider.ts";

export type DomainEvent<TType extends string, TPayload> = {
    id: string;
    seq: number;
    type: TType;
    payload: TPayload;
    occurredAt: number;
    correlationId?: string;
    causationId?: string;
}

// All kinds of domain events defined here.
export type SessionCreated = DomainEvent<"session.created", {
    sessionId: string;
    provider: Provider;
    workspacePath: string;
    title: string;
    createdAt: number;
}>;

export type TurnStarted = DomainEvent<"turn.started", {
    sessionId: string;
    turnId: string;
    provider: Provider;
    startedAt: number;
}>;

export type UserMessageCreated = DomainEvent<"message.userCreated", {
    sessionId: string;
    turnId: string;
    messageId: string;
    text: string;
    attachments: MessageAttachment[];
}>;

export type AssistantDeltaReceived = DomainEvent<"message.assistantDeltaReceived", {
    sessionId: string;
    turnId: string;
    messageId: string;
    text: string;
}>;

export type AssistantMessageCompleted = DomainEvent<"message.assistantCompleted", {
    sessionId: string;
    turnId: string;
    messageId: string;
}>;

export type ToolCallStarted = DomainEvent<"tool.callStarted", {
    sessionId: string;
    turnId: string;
    toolCallId: string;
    toolName: string;
    input: unknown;
    risk: ToolRisk;
}>;

export type ToolCallCompleted = DomainEvent<"tool.callCompleted", {
    sessionId: string;
    turnId: string;
    toolCallId: string;
    output: unknown;
    isError: boolean;
}>;

export type ApprovalRequested = DomainEvent<"approval.requested", {
    approvalId: string;
    sessionId: string;
    turnId: string;
    toolCallId: string;
    toolName: string;
    input: unknown;
    risk: ToolRisk;
}>;

export type ApprovalResolved = DomainEvent<"approval.resolved", {
    approvalId: string;
    approved: boolean;
    note?: string;
}>;

export type TurnCompleted = DomainEvent<"turn.completed", {
    sessionId: string;
    turnId: string;
    completedAt: number;
}>;

export type TurnFailed = DomainEvent<"turn.failed", {
    sessionId: string;
    turnId: string;
    message: string;
    retryable: boolean;
    correlationId?: string;
}>;

export type TurnCanceled = DomainEvent<"turn.canceled", {
    sessionId: string;
    turnId: string;
    canceledAt: number;
}>;