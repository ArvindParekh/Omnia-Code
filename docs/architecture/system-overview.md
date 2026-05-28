# System Overview

Omnia is a desktop UI over a local app server. The UI is not the source of truth. The durable event store is.

## Target Runtime Shape

```text
Electron Renderer
  React UI
  renderer read models
  typed client API

Electron Preload
  narrow contextBridge API

Electron Main
  window lifecycle
  native menus/tray/notifications
  app-server sidecar lifecycle
  local transport/auth bootstrap

Omnia App Server
  command handling
  event store
  projections
  session lifecycle
  turn lifecycle
  approval lifecycle
  provider registry
  provider adapters
  workspace/git/checkpoint operations

Provider Runtimes
  Claude
  Codex
  Gemini
  OpenCode
  Cursor

SQLite
  sessions
  turns
  events
  provider refs
  approvals
  checkpoints
  settings
```

## First Implementation Shape

The first implementation may load `packages/app-server` inside Electron main.

That is acceptable only if these rules hold:

1. `packages/app-server` imports no Electron APIs.
2. `packages/app-server` talks through contracts, not renderer types.
3. Provider adapters can later run in a sidecar or child process without changing renderer contracts.
4. SQLite paths and app data paths are provided through configuration, not hardcoded Electron globals.

## Main Flow

```text
renderer sends command: turn.startRequested
Electron forwards command to app server
app server validates session and workspace
app server appends message.userCreated
app server appends turn.started
provider reactor starts provider stream
provider adapter emits normalized provider events
app server appends domain events
app server updates projections
app server publishes events to renderer
renderer updates read models
```

On restart:

```text
app server opens SQLite
projections rebuild or load snapshots
renderer requests current read models
renderer subscribes to new events
```

## Core Modules

**Command Router**

Accepts commands from transports, validates the command envelope, calls the correct command handler, and returns a receipt.

**Event Store**

Assigns monotonic sequence numbers and appends events transactionally.

**Projection Pipeline**

Updates read models after events are committed.

**Session Service**

Owns session creation, title/status metadata, provider selection, workspace association, and provider session refs.

**Turn Service**

Owns turn start, cancel, completion, and failure. It does not know provider-specific SDK details.

**Provider Registry**

Detects available providers, constructs provider adapters, and routes sessions to the correct adapter.

**Approval Service**

Creates, resolves, and persists approval requests.

**Workspace Service**

Resolves allowed workspace paths, enforces workspace scope, and provides workspace metadata.

**Checkpoint Service**

Captures before/after state for turns. Initial implementation can use git status/diff only; later implementation can use worktrees or snapshots.

## Design Rules

1. Renderer never calls a provider directly.
2. Renderer never writes the event store.
3. Provider adapters never mutate UI state.
4. Provider adapters never choose durable event sequence numbers.
5. All cross-boundary data uses `packages/contracts`.
6. Every long-running turn has cancellation.
7. Every event can be serialized to JSON.
8. Every provider-native event is either mapped, ignored explicitly, or stored as diagnostic metadata.

