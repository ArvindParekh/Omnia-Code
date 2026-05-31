// these commands do not mirror @omnia/providers/types.ts exactly, and that is intentional. app-server sits between the UI and the providerAdapter, and it will load all the missing fields to the command intent before forwarding it to the providerAdapter.
import type { MessageAttachment, Provider } from "./provider.ts"

type CommandPayloadMap = {
  "session.createRequested": {
      provider: Provider;
      workspacePath: string;
      title?: string;
  },
  "turn.startRequested": {
      sessionId: string;
      text: string;
      attachments?: MessageAttachment[];
  },
  "turn.cancelRequested": {
      sessionId: string;
      turnId: string;
  },
  "approval.resolveRequested": {
      approvalId: string;
      approved: boolean;
      note?: string;
  },
}

export type CommandType = keyof CommandPayloadMap;

export type CommandEnvelope<TType extends string, TPayload> = {
    id: string;
    type: TType;
    payload: TPayload;
    requestedAt: number;
    requestedBy: "user" | "system";
}

export type CommandEnvelopeFor<TType extends CommandType> = CommandEnvelope<TType, CommandPayloadMap[TType]>;

// All kinds of available commands defined here.
export type SessionCreateRequested = CommandEnvelopeFor<"session.createRequested">;

export type TurnStartRequested = CommandEnvelopeFor<"turn.startRequested">;

export type TurnCancelRequested = CommandEnvelopeFor<"turn.cancelRequested">;

export type ApprovalResolveRequested = CommandEnvelopeFor<"approval.resolveRequested">;
