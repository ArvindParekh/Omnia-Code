import type { MessageAttachment, Provider, ToolRisk } from "./provider.ts";
import type { ProviderSessionRef, SessionPolicy } from "./session.ts";

export type EventPayloadMap = {
	"session.created": {
		sessionId: string;
		provider: Provider;
		workspacePath: string;
		title: string;
		policy: SessionPolicy;
		ref: ProviderSessionRef;
		createdAt: number;
	};
	"turn.started": {
		sessionId: string;
		turnId: string;
		provider: Provider;
		startedAt: number;
	};
	"message.userCreated": {
		sessionId: string;
		turnId: string;
		messageId: string;
		text: string;
		attachments: MessageAttachment[];
	};
	"message.assistantDeltaReceived": {
		sessionId: string;
		turnId: string;
		messageId: string;
		text: string;
	};
	"message.assistantCompleted": {
		sessionId: string;
		turnId: string;
		messageId: string;
	};
	"message.reasoningDeltaReceived": {
		sessionId: string;
		turnId: string;
		messageId: string;
		text: string;
	};
	"tool.callStarted": {
		sessionId: string;
		turnId: string;
		toolCallId: string;
		toolName: string;
		input: unknown;
		risk: ToolRisk;
	};
	"tool.callCompleted": {
		sessionId: string;
		turnId: string;
		toolCallId: string;
		output: unknown;
		isError: boolean;
	};
	"approval.requested": {
		approvalId: string;
		sessionId: string;
		turnId: string;
		toolCallId: string;
		toolName: string;
		input: unknown;
		risk: ToolRisk;
	};
	"approval.resolved": {
		approvalId: string;
		approved: boolean;
		note?: string;
	};
	"turn.completed": {
		sessionId: string;
		turnId: string;
		completedAt: number;
	};
	"turn.failed": {
		sessionId: string;
		turnId: string;
		message: string;
		retryable: boolean;
		correlationId?: string;
	};
	"turn.canceled": {
		sessionId: string;
		turnId: string;
		canceledAt: number;
	};
};

export type EventType = keyof EventPayloadMap;
export type EventPayload<T extends EventType> = EventPayloadMap[T];

export type DomainEvent<TType extends string, TPayload> = {
	id: string;
	seq: number;
	type: TType;
	payload: TPayload;
	occurredAt: number;
	correlationId?: string;
	causationId?: string;
};

export type DomainEventFor<T extends EventType> = DomainEvent<T, EventPayload<T>>;

// An event that has been constructed but not yet appended to the store. `seq` is
// assigned by the store on insert, so holding a `DomainEvent` means it's durable.
export type DraftEvent<T extends EventType> = Omit<DomainEventFor<T>, "seq">;

// All kinds of domain events defined here.
export type SessionCreated = DomainEventFor<"session.created">;
export type TurnStarted = DomainEventFor<"turn.started">;

export type UserMessageCreated = DomainEventFor<"message.userCreated">;

export type AssistantDeltaReceived = DomainEventFor<"message.assistantDeltaReceived">;

export type AssistantMessageCompleted = DomainEventFor<"message.assistantCompleted">;

export type ReasoningDeltaReceived = DomainEventFor<"message.reasoningDeltaReceived">;

export type ToolCallStarted = DomainEventFor<"tool.callStarted">;

export type ToolCallCompleted = DomainEventFor<"tool.callCompleted">;

export type ApprovalRequested = DomainEventFor<"approval.requested">;

export type ApprovalResolved = DomainEventFor<"approval.resolved">;

export type TurnCompleted = DomainEventFor<"turn.completed">;

export type TurnFailed = DomainEventFor<"turn.failed">;

export type TurnCanceled = DomainEventFor<"turn.canceled">;

export type AllEvents<T extends EventType> = {
	[K in T]: DomainEventFor<K>;
}[T];

export type AllDraftEvents<T extends EventType> = {
	[K in T]: DraftEvent<K>;
}[T];
