# Provider Adapters

Provider adapters hide provider-specific APIs and stream formats from the rest of Omnia.

The app server speaks Omnia contracts. Adapters speak provider SDKs and CLIs.

## Adapter Interface

```ts
type ProviderAdapter = {
  readonly provider: Provider;

  detect(): Promise<ProviderAvailability>;

  createSession(input: CreateProviderSessionInput): Promise<ProviderSessionRef>;

  resumeSession(input: ResumeProviderSessionInput): Promise<void>;

  sendTurn(input: SendProviderTurnInput): AsyncIterable<ProviderRuntimeEvent>;

  cancelTurn(input: CancelProviderTurnInput): Promise<void>;

  resolveApproval(input: ResolveProviderApprovalInput): Promise<void>;

  disposeSession(input: DisposeProviderSessionInput): Promise<void>;
};
```

## Adapter Inputs

```ts
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

type SendProviderTurnInput = {
  sessionId: string;
  providerSessionRef: ProviderSessionRef;
  turnId: string;
  text: string;
  attachments: MessageAttachment[];
  workspacePath: string;
  policy: SessionPolicy;
  signal: AbortSignal;
};
```

## Provider Registry

The provider registry owns adapter construction and availability.

Responsibilities:

- detect installed/authenticated providers
- expose provider availability to UI
- construct adapters lazily
- return the adapter for a session provider
- prevent unsupported providers from appearing as available

The registry should hold many adapters, not one mutable active provider.

Bad:

```ts
class ProviderService {
  provider: AIProvider | null;
}
```

Good:

```ts
class ProviderRegistry {
  adapterFor(provider: Provider): ProviderAdapter;
}
```

## First Providers

Build in this order:

1. `FakeProviderAdapter`
2. `ClaudeAdapter`
3. `CodexAdapter`
4. `OpenCodeAdapter`
5. `GeminiAdapter`
6. `CursorAdapter`

The fake adapter comes first because it makes command/event/projection tests deterministic.

## Claude Adapter Notes

Claude should prove the vertical slice:

- create Omnia session
- create/resume provider session
- send turn
- stream assistant deltas
- surface tool calls if SDK exposes them
- surface approval requests if SDK exposes them
- handle failure events
- support cancellation
- persist provider session ref

Do not let Claude-specific fields leak into common events. Put raw provider metadata under diagnostic fields only when useful.

## Runtime Isolation

Initial implementation may run provider adapters in the app-server process.

Target isolation:

```text
app-server
  -> provider adapter facade
  -> provider runtime process
  -> provider CLI/SDK
```

Move providers to child processes when:

- one provider can crash the app server
- provider dependencies conflict
- provider runtime memory grows unpredictably
- provider streams need independent restart
- security policy requires stronger isolation

## Approval Handling

Adapters can report approval requests, but the app server owns durable approval state.

Flow:

```text
provider requests approval
adapter yields approval.requested runtime event
app server appends approval.requested domain event
renderer shows approval UI
user resolves approval
app server appends approval.resolved
app server calls adapter.resolveApproval
provider continues or rejects action
```

## Detection

Provider detection should return structured data.

```ts
type ProviderAvailability = {
  provider: Provider;
  status: "available" | "missing" | "needs_auth" | "error";
  label: string;
  detail?: string;
  detectedVersion?: string;
};
```

Avoid returning `true` for providers that are not implemented.

## Provider Adapter Tests

Every adapter needs tests for:

- detection
- session creation
- streaming text
- tool event mapping
- approval event mapping
- cancellation
- retryable and non-retryable errors
- provider-native malformed events

Real provider integration tests should be opt-in. Unit tests should use fake provider streams.

