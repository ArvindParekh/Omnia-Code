# Persistence

Omnia is local-first. SQLite is the durable source of truth.

The first persistence goal is not complex querying. The first goal is that sessions survive restart and can be replayed.

## Storage Location

The app should store data under the platform app data directory, not the project repository.

Example logical paths:

```text
omnia.db
logs/
provider-cache/
attachments/
```

Electron should provide the app data path to app-server configuration. App-server should not import Electron to find it.

## Core Tables

### `events`

Append-only domain event log.

```text
seq integer primary key autoincrement
id text unique not null
type text not null
payload_json text not null
occurred_at integer not null
correlation_id text
causation_id text
```

### `sessions`

Projection of current session state.

```text
id text primary key
provider text not null
workspace_path text not null
title text not null
status text not null
created_at integer not null
updated_at integer not null
last_turn_id text
```

### `turns`

Projection of current turn state.

```text
id text primary key
session_id text not null
status text not null
started_at integer not null
completed_at integer
failed_at integer
canceled_at integer
error_json text
```

### `provider_sessions`

Provider-native session refs.

```text
session_id text primary key
provider text not null
external_id text
state_json text
updated_at integer not null
```

### `messages`

Chat transcript projection.

```text
id text primary key
session_id text not null
turn_id text not null
role text not null
content text not null
status text not null
created_at integer not null
updated_at integer not null
```

### `tool_calls`

Tool call projection.

```text
id text primary key
session_id text not null
turn_id text not null
tool_name text not null
input_json text not null
output_json text
status text not null
risk_json text
created_at integer not null
updated_at integer not null
```

### `approvals`

Approval projection.

```text
id text primary key
session_id text not null
turn_id text not null
tool_call_id text not null
status text not null
approved integer
request_json text not null
note text
created_at integer not null
resolved_at integer
```

### `checkpoints`

Turn checkpoint projection.

```text
id text primary key
session_id text not null
turn_id text not null
kind text not null
ref text
summary_json text
created_at integer not null
```

## Event Append Transaction

Event append should be transactional:

```text
begin transaction
append event
apply event to projections
commit
publish event to subscribers
```

Publish after commit. UI should not see events that failed to persist.

## Replay

Omnia should support projection rebuild:

```text
clear projections
read events ordered by seq
apply each event
```

This gives:

- crash recovery
- migration safety
- testability
- debugging tools
- future session replay UI

## Snapshots

Do not build projection snapshots immediately.

Add snapshots when event replay becomes slow. Until then, simple ordered replay is easier to reason about.

## Attachments

Large files and binary data should not live directly in event payloads.

Events should store attachment refs:

```ts
type AttachmentRef = {
  id: string;
  kind: "file" | "image" | "diff" | "log";
  path: string;
  contentType?: string;
  sizeBytes?: number;
};
```

## Migrations

Use explicit migrations from the start.

Rules:

- migrations are ordered
- migrations are idempotent or tracked
- startup fails clearly if migration fails
- tests run migrations against an empty database

## What Not To Store First

Defer:

- token accounting unless provider exposes it cleanly
- full provider raw logs unless needed for diagnostics
- cloud sync state
- plugin storage
- metrics dashboards

Store only what is needed for reliable sessions, replay, approvals, and debugging.

