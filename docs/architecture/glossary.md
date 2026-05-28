# Glossary

Use these terms consistently in code, docs, UI labels, issues, and tests.

## Product Terms

**Omnia**

The desktop application and local agent control room.

**Provider**

A supported agent family, such as Claude, Codex, Gemini, OpenCode, or Cursor.

**Agent**

The provider-owned coding assistant that receives user input and performs work. Omnia does not own the model; Omnia supervises and records the interaction.

**Workspace**

A local directory where a session is allowed to inspect, edit, run commands, and create checkpoints. A workspace is always explicit. It should not default silently to the user's home directory.

**Session**

A durable Omnia conversation container. A session has one provider, one workspace, metadata, and many turns.

**Provider Session**

The provider-native conversation reference behind an Omnia session, such as a Codex thread ID, Claude SDK session, OpenCode session ID, or Cursor agent ID.

**Turn**

One user request and all provider activity that happens in response. A turn starts from user intent and ends as completed, failed, or canceled.

**Message**

Human-readable chat content. Messages are not the whole session state; they are one projection derived from events.

**Tool Call**

A provider or agent request to perform an operation, such as reading a file, editing a file, running a command, querying git, or calling an MCP tool.

**Approval**

A user decision gate for a provider action. Approvals are durable facts, not transient UI modals.

**Checkpoint**

A snapshot or git reference that lets Omnia compare, accept, reject, or roll back agent work.

## Architecture Terms

**Command**

A request to change system state. Commands are named in the imperative or request form, for example `turn.startRequested`.

**Event**

An immutable fact that already happened. Events are named in the past tense, for example `turn.started`.

**Event Store**

The append-only durable log of events. The event store is the source of truth for session history.

**Projection**

A queryable read model derived from events. Examples: session list, chat transcript, event tree, approvals inbox.

**Read Model**

The current state used by UI or services, rebuilt from events or updated as events are appended.

**Reactor**

A process that listens to events and triggers side effects. Provider execution, checkpointing, notifications, and metrics are reactors.

**App Server**

The package/process that owns commands, event persistence, projections, sessions, turns, approvals, provider adapters, and workspace operations.

**Sidecar**

A separate local process running the app server. Electron starts it, monitors it, and communicates over a local authenticated transport. The first implementation may run in-process, but app-server code must stay sidecar-ready.

**Transport**

The communication layer between renderer, Electron main, and app server. Initial transport can be Electron IPC. Target transport can be local HTTP/WebSocket or JSON-RPC.

**Provider Adapter**

Omnia's concrete implementation for one provider. It maps Omnia commands to provider APIs and maps provider-native events back to Omnia events.

**Runtime**

The live provider execution context: process, SDK object, server, thread, or stream currently doing work.

**Capability**

An explicit permission to perform a class of action, such as shell execution, file writes, network access, or MCP tool usage.

**Policy**

Rules that decide which capabilities are allowed, denied, or require approval.

