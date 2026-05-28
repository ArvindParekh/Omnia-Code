# Events And Commands

Commands and events are the core contract of Omnia.

Commands express intent. Events record facts. Projections turn facts into UI-ready state.

## Naming

Commands use request-oriented names:

```text
session.createRequested
turn.startRequested
turn.cancelRequested
approval.resolveRequested
```

Events use past-tense names:

```text
session.created
turn.started
message.userCreated
message.assistantDeltaReceived
tool.callStarted
approval.requested
turn.completed
```

## Command Envelope

Every command crossing a process/package boundary should use an envelope.

```ts
type CommandEnvelope<TType extends string, TPayload> = {
  id: string;
  type: TType;
  payload: TPayload;
  requestedAt: number;
  requestedBy: "user" | "system";
};
```

Command IDs support idempotency and diagnostics.

## Initial Commands

```ts
type SessionCreateRequested = CommandEnvelope<
  "session.createRequested",
  {
    provider: Provider;
    workspacePath: string;
    title?: string;
  }
>;

type TurnStartRequested = CommandEnvelope<
  "turn.startRequested",
  {
    sessionId: string;
    text: string;
    attachments?: MessageAttachment[];
  }
>;

type TurnCancelRequested = CommandEnvelope<
  "turn.cancelRequested",
  {
    sessionId: string;
    turnId: string;
  }
>;

type ApprovalResolveRequested = CommandEnvelope<
  "approval.resolveRequested",
  {
    approvalId: string;
    approved: boolean;
    note?: string;
  }
>;
```

## Event Envelope

Every durable event has a sequence number assigned by the event store.

```ts
type DomainEvent<TType extends string, TPayload> = {
  id: string;
  seq: number;
  type: TType;
  payload: TPayload;
  occurredAt: number;
  correlationId?: string;
  causationId?: string;
};
```

Definitions:

- `seq`: global monotonic event sequence.
- `correlationId`: groups events from the same user-level operation.
- `causationId`: command or event that caused this event.

## Initial Event Set

```ts
type SessionCreated = DomainEvent<
  "session.created",
  {
    sessionId: string;
    provider: Provider;
    workspacePath: string;
    title: string;
    createdAt: number;
  }
>;

type TurnStarted = DomainEvent<
  "turn.started",
  {
    sessionId: string;
    turnId: string;
    provider: Provider;
    startedAt: number;
  }
>;

type UserMessageCreated = DomainEvent<
  "message.userCreated",
  {
    sessionId: string;
    turnId: string;
    messageId: string;
    text: string;
    attachments: MessageAttachment[];
  }
>;

type AssistantDeltaReceived = DomainEvent<
  "message.assistantDeltaReceived",
  {
    sessionId: string;
    turnId: string;
    messageId: string;
    text: string;
  }
>;

type AssistantMessageCompleted = DomainEvent<
  "message.assistantCompleted",
  {
    sessionId: string;
    turnId: string;
    messageId: string;
  }
>;

type ToolCallStarted = DomainEvent<
  "tool.callStarted",
  {
    sessionId: string;
    turnId: string;
    toolCallId: string;
    toolName: string;
    input: unknown;
    risk: ToolRisk;
  }
>;

type ToolCallCompleted = DomainEvent<
  "tool.callCompleted",
  {
    sessionId: string;
    turnId: string;
    toolCallId: string;
    output: unknown;
    isError: boolean;
  }
>;

type ApprovalRequested = DomainEvent<
  "approval.requested",
  {
    approvalId: string;
    sessionId: string;
    turnId: string;
    toolCallId: string;
    toolName: string;
    input: unknown;
    risk: ToolRisk;
  }
>;

type ApprovalResolved = DomainEvent<
  "approval.resolved",
  {
    approvalId: string;
    approved: boolean;
    note?: string;
  }
>;

type TurnCompleted = DomainEvent<
  "turn.completed",
  {
    sessionId: string;
    turnId: string;
    completedAt: number;
  }
>;

type TurnFailed = DomainEvent<
  "turn.failed",
  {
    sessionId: string;
    turnId: string;
    message: string;
    retryable: boolean;
    correlationId: string;
  }
>;

type TurnCanceled = DomainEvent<
  "turn.canceled",
  {
    sessionId: string;
    turnId: string;
    canceledAt: number;
  }
>;
```

## Provider Runtime Events

Provider adapters may emit normalized runtime events before they become durable domain events.

```ts
type ProviderRuntimeEvent =
  | { type: "assistant.delta"; text: string }
  | { type: "assistant.completed" }
  | { type: "tool.started"; toolCallId: string; toolName: string; input: unknown; risk: ToolRisk }
  | { type: "tool.completed"; toolCallId: string; output: unknown; isError: boolean }
  | { type: "approval.requested"; approvalId: string; toolCallId: string; toolName: string; input: unknown; risk: ToolRisk }
  | { type: "runtime.failed"; message: string; retryable: boolean; providerCorrelationId?: string };
```

The app server maps provider runtime events to domain events.

## Why This Shape

This gives Omnia:

- durable replay
- event tree rendering
- chat transcript rendering
- approval inbox rendering
- failure reports
- provider comparison
- debugging tools
- testable command handlers

## Anti-Patterns

Avoid:

- UI-only event types that are not persisted.
- Provider-native event shapes leaking into renderer components.
- Direct state mutation from provider streams.
- Event types named after transport, such as `agent:event`.
- Session state that can only be reconstructed from in-memory provider objects.

