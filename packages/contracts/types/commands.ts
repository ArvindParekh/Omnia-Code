// these commands do not mirror @omnia/providers/types.ts exactly, and that is intentional. app-server sits between the UI and the providerAdapter, and it will load all the missing fields to the command intent before forwarding it to the providerAdapter.
import type { MessageAttachment, Provider } from "./provider.ts"

export type CommandEnvelope<TType extends string, TPayload> = {
    id: string;
    type: TType;
    payload: TPayload;
    requestedAt: number;
    requestedBy: "user" | "system";
}

export type SessionCreateRequested = CommandEnvelope<"session.createRequested", {
    provider: Provider;
    workspacePath: string;
    title?: string;
}>;

export type TurnStartRequested = CommandEnvelope<"turn.startRequested", {
    sessionId: string;
    text: string;
    attachments?: MessageAttachment[];
}>;

export type TurnCancelRequested = CommandEnvelope<"turn.cancelRequested", {
    sessionId: string;
    turnId: string;
}>;

export type ApprovalResolveRequested = CommandEnvelope<"approval.resolveRequested", {
    approvalId: string;
    approved: boolean;
    note?: string;
}>;