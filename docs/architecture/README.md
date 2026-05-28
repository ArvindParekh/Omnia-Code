# Omnia Architecture

This directory defines the target architecture for Omnia Code.

Omnia is a local-first desktop control room for coding agents. It wraps existing agent CLIs and SDKs, records everything they do, and renders sessions as inspectable, replayable timelines.

## Documents

- [Glossary](./glossary.md) defines the words used across code and docs.
- [System Overview](./system-overview.md) describes the runtime shape.
- [Packages And Organization](./packages-and-organization.md) defines the Bun workspace layout and dependency rules.
- [Events And Commands](./events-and-commands.md) defines the durable contract between UI, app-server, providers, and persistence.
- [Provider Adapters](./provider-adapters.md) defines how Omnia talks to Claude, Codex, Gemini, OpenCode, Cursor, and future providers.
- [Persistence](./persistence.md) defines the local SQLite model and replay strategy.
- [Migration Plan](./migration-plan.md) defines how to move from the current prototype to the target architecture.

## Architectural Priorities

1. **Transparency first**: every important agent action becomes a durable event.
2. **Local-first**: sessions, turns, events, approvals, and provider refs survive restarts.
3. **Provider-neutral core**: provider quirks stay behind adapters.
4. **Thin desktop shell**: Electron manages desktop lifecycle; orchestration lives in app-server code.
5. **Replayable state**: UI state is derived from persisted events, not hidden mutable objects.
6. **Security by mediation**: file, shell, network, and approval-sensitive actions pass through explicit Omnia surfaces.

## Current Decision

Use a Bun workspace monorepo from this point forward.

The first implementation may run the app-server in the Electron main process for speed, but the package boundary must be sidecar-ready. App-server code should not depend on Electron APIs.

