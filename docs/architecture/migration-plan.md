# Migration Plan

This plan moves the current Electron/Vite prototype into the target Bun workspace architecture without freezing product progress.

## Phase 0: Baseline Cleanup

Goal: make the current app build reliably.

Tasks:

1. Use Bun as the only package manager.
2. Make `bun run build`, `bun run lint`, and `bun run typecheck` real scripts.
3. Fix shadcn alias drift so generated UI imports match `apps/desktop/src/renderer`.
4. Align current shared `AgentEvent` type with the UI event tree or simplify the UI mocks.
5. Make Claude honestly available/unavailable; do not report unimplemented providers as available.
6. Move mock sessions/messages/events into fixtures.

Verification:

```bash
bun run lint
bun run typecheck
bun run build
```

## Phase 1: Workspace Skeleton

Goal: create the monorepo shape without changing behavior.

Target:

```text
apps/desktop
packages/contracts
packages/app-server
packages/providers
packages/persistence
packages/config
```

Tasks:

1. Move current Electron/React app into `apps/desktop`.
2. Create `packages/contracts` and move shared types there.
3. Create empty package shells for app-server, providers, persistence, and config.
4. Update TypeScript path references and Bun workspace config.
5. Keep existing app behavior as close as possible.

Verification:

```bash
bun install
bun run typecheck
bun run build
```

## Phase 2: Contracts First

Goal: define durable command and event contracts.

Tasks:

1. Add command envelope types.
2. Add domain event envelope types.
3. Add session, turn, approval, provider, and workspace types.
4. Replace renderer-specific event assumptions with contract types.
5. Add fake event fixtures using contract types.

Verification:

- TypeScript catches invalid event names.
- UI fixtures compile against contract types.
- No provider SDK types leak into contracts.

## Phase 3: In-Process App Server

Goal: introduce app-server orchestration while still running inside Electron main.

Tasks:

1. Add command router.
2. Add in-memory event store.
3. Add projection pipeline.
4. Add session and turn services.
5. Add fake provider adapter.
6. Wire renderer to command flow through Electron IPC.

Verification:

- Create fake session.
- Send fake turn.
- Stream fake deltas.
- Event tree renders from events.
- Chat renders from projections.

## Phase 4: SQLite Event Store

Goal: make sessions durable.

Tasks:

1. Add SQLite connection package.
2. Add migrations.
3. Implement SQLite event store.
4. Implement projections for sessions, turns, messages, tool calls, and approvals.
5. Replay projections from event log on startup.

Verification:

- Create session.
- Send turn.
- Quit app.
- Reopen app.
- Session, chat, and event tree reappear from SQLite.

## Phase 5: Claude Vertical Slice

Goal: make one real provider production-shaped.

Tasks:

1. Implement `ClaudeAdapter`.
2. Map Claude stream events to provider runtime events.
3. Map provider runtime events to Omnia domain events.
4. Persist provider session refs.
5. Implement cancellation.
6. Implement errors as durable `turn.failed` events.
7. Surface approvals if the SDK exposes them.

Verification:

- Create Claude session.
- Send message.
- Stream response.
- Cancel a long turn.
- Persist and replay session.
- Failure produces durable diagnostic event.

## Phase 6: Approval And Risk Model

Goal: make user trust a first-class feature.

Tasks:

1. Add tool risk classification.
2. Persist approval requests.
3. Render approval inbox and inline approval cards.
4. Resolve approvals through command flow.
5. Add session policy settings.

Verification:

- Approval requests survive restart.
- Approval resolution is durable.
- Provider receives approval decision.

## Phase 7: Sidecar Boundary

Goal: move app-server out of Electron main without changing renderer contracts.

Tasks:

1. Add local transport package.
2. Run app-server as a Bun sidecar process.
3. Electron main starts/stops sidecar.
4. Electron main forwards renderer commands to sidecar.
5. Renderer subscriptions continue to receive events.

Verification:

- App works with sidecar.
- Sidecar crash is detected.
- Restart sidecar without losing SQLite state.

## Phase 8: More Providers

Goal: add providers as adapters, not architecture changes.

Order:

1. Codex
2. OpenCode
3. Gemini
4. Cursor

Each provider must pass the same adapter test suite.

## Phase 9: Differentiators

Goal: build Omnia's product wedge.

Features:

- flight recorder timeline
- provider comparison mode
- git worktree attempts
- failure reports
- session search
- trust/approval policy editor
- community adapter/plugin API

## Stop Conditions

Pause and simplify if:

- build is red for more than one phase
- provider-specific code leaks into renderer
- event names change casually
- app-server imports Electron
- persistence schema is designed before event contracts
- packages exist with no external consumer
