# Packages And Organization

Omnia uses Bun workspaces.

The package map should make navigation easier. A package earns its place when it has a stable ownership boundary, a public interface, and consumers outside itself.

## Target Workspace

```text
apps/
  desktop/
    src/
      main/
      preload/
      renderer/

packages/
  contracts/
  app-server/
  providers/
  persistence/
  config/
  workspace/
  git/
  transport/
  testing/
```

## Build Now

These packages are worth creating immediately.

```text
packages/contracts
packages/app-server
packages/providers
packages/persistence
packages/config
apps/desktop
```

### `packages/contracts`

Owns shared serializable types.

Examples:

- commands
- events
- sessions
- turns
- providers
- approvals
- workspace refs
- transport envelopes
- serialized errors

Rules:

- No Electron imports.
- No provider SDK imports.
- No database imports.
- Prefer plain TypeScript types first.
- Add runtime schemas later when command/event shape stabilizes.

### `packages/app-server`

Owns orchestration.

Examples:

- command handlers
- event append flow
- projection updates
- session lifecycle
- turn lifecycle
- approval lifecycle
- provider registry integration

Rules:

- No React imports.
- No Electron imports.
- No provider SDK imports except through `packages/providers`.
- No direct SQLite calls except through `packages/persistence`.

### `packages/providers`

Owns provider adapter interfaces and concrete adapters.

Examples:

- `ProviderAdapter`
- `ClaudeAdapter`
- `CodexAdapter`
- `GeminiAdapter`
- `OpenCodeAdapter`
- `CursorAdapter`
- `FakeProviderAdapter`

Rules:

- Depends on `contracts`.
- May depend on provider SDKs.
- Does not own durable event sequence numbers.
- Does not write SQLite directly.

### `packages/persistence`

Owns local storage.

Examples:

- SQLite connection
- migrations
- event store implementation
- projection storage
- transaction helpers

Rules:

- Depends on `contracts`.
- Does not depend on provider SDKs.
- Does not depend on React or Electron.

### `packages/config`

Owns environment, app paths, feature flags, and user-config resolution.

Rules:

- Can expose app-server config types.
- Platform-specific path providers are injected by the app.
- Does not read UI state.

### `apps/desktop`

Owns Electron and React.

Examples:

- Electron main process
- preload bridge
- renderer app
- shadcn components
- renderer state stores
- native app lifecycle

Rules:

- Can depend on contracts.
- Can depend on app-server during first implementation.
- Should later manage app-server as a sidecar.
- Renderer imports no Node-only modules.

## Extract Later

These packages are useful, but only once real complexity exists.

```text
packages/workspace
packages/git
packages/transport
packages/testing
packages/plugin-sdk
packages/telemetry
packages/security
```

Extract when at least two modules need the boundary.

Examples:

- Move `workspace` out when both app-server and providers need workspace policy.
- Move `git` out when checkpoints, UI previews, and provider context all use it.
- Move `transport` out when app-server supports both Electron IPC and sidecar WebSocket/JSON-RPC.
- Move `testing` out when fake providers and event fixtures are reused across packages.

## Dependency Direction

```text
apps/desktop
  -> contracts
  -> app-server

app-server
  -> contracts
  -> providers
  -> persistence
  -> config

providers
  -> contracts

persistence
  -> contracts

config
  -> contracts
```

Forbidden:

```text
contracts -> anything app-specific
providers -> app-server
persistence -> app-server
app-server -> apps/desktop
renderer -> provider SDKs
renderer -> SQLite
```

## Package Graduation Rule

Create a package when all of these are true:

1. It has a clear public interface.
2. It hides meaningful implementation detail.
3. It has at least one real consumer outside itself.
4. Its tests can exercise behavior through its public interface.
5. Deleting it would move complexity into multiple callers, not make complexity vanish.

Do not create packages just to mirror nouns.

## Bun Workspace Notes

Use Bun as the single package manager.

Recommended root files:

```text
package.json
bun.lock
tsconfig.base.json
apps/desktop/package.json
packages/*/package.json
```

Root `package.json` should define workspaces:

```json
{
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

Package names should use an internal scope:

```text
@omnia/contracts
@omnia/app-server
@omnia/providers
@omnia/persistence
@omnia/config
@omnia/desktop
```

