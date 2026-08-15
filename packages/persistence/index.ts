import { DatabaseSync } from "node:sqlite";
import type {
	AllDraftEvents,
	AllEvents,
	DomainEventFor,
	EventStore,
	EventType,
} from "@omnia/contracts";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  seq            INTEGER PRIMARY KEY,  -- rowid alias; DB-assigned, monotonic
  id             TEXT    NOT NULL UNIQUE,
  stream_id      TEXT    NOT NULL,     -- sessionId
  type           TEXT    NOT NULL,
  payload        TEXT    NOT NULL,     -- JSON
  occurred_at    INTEGER NOT NULL,     -- epoch ms
  correlation_id TEXT,
  causation_id   TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_events_stream ON events (stream_id, seq);
CREATE INDEX IF NOT EXISTS idx_events_type ON events (type, seq);
`;

type EventRow = {
	seq: number;
	id: string;
	stream_id: string;
	type: EventType;
	payload: string;
	occurred_at: number;
	correlation_id: string | null;
	causation_id: string | null;
};

export class SqliteEventStore implements EventStore {
	private readonly db: DatabaseSync;
	private readonly insert;
	private readonly selectAll;
	private readonly selectStream;
	private readonly selectByType;
	private listeners: ((event: AllEvents<EventType>) => void)[] = [];

	constructor(dbPath: string) {
		this.db = new DatabaseSync(dbPath);

		// WAL lets reads proceed during writes. `synchronous = NORMAL` under WAL
		// trades "lose the last few commits on OS crash" for a large write
		// throughput win — the file can still never corrupt.
		this.db.exec(`
			PRAGMA journal_mode = WAL;
			PRAGMA synchronous = NORMAL;
			PRAGMA busy_timeout = 5000;
		`);
		this.db.exec(SCHEMA);

		this.insert = this.db.prepare(
			`INSERT INTO events (id, stream_id, type, payload, occurred_at, correlation_id, causation_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		);
		this.selectAll = this.db.prepare("SELECT * FROM events ORDER BY seq");
		this.selectStream = this.db.prepare("SELECT * FROM events WHERE stream_id = ? ORDER BY seq");
		this.selectByType = this.db.prepare("SELECT * FROM events WHERE type = ? ORDER BY seq");
	}

	addEvent(draft: AllDraftEvents<EventType>): AllEvents<EventType> {
		const streamId = "sessionId" in draft.payload ? String(draft.payload.sessionId) : "";

		const { lastInsertRowid } = this.insert.run(
			draft.id,
			streamId,
			draft.type,
			JSON.stringify(draft.payload),
			draft.occurredAt,
			draft.correlationId ?? null,
			draft.causationId ?? null,
		);

		const event = { ...draft, seq: Number(lastInsertRowid) } as AllEvents<EventType>;

		for (const listener of this.listeners) listener(event);
		return event;
	}

	getEvents(sessionId?: string): AllEvents<EventType>[] {
		const rows = (sessionId
			? this.selectStream.all(sessionId)
			: this.selectAll.all()) as unknown as EventRow[];
		return rows.map(hydrate);
	}

	getEventsByType<K extends EventType>(type: K): DomainEventFor<K>[] {
		const rows = this.selectByType.all(type) as unknown as EventRow[];
		return rows.map(hydrate) as DomainEventFor<K>[];
	}

	subscribe(listener: (event: AllEvents<EventType>) => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener); //unsub
		};
	}

	close(): void {
		this.db.close();
	}
}

function hydrate(row: EventRow): AllEvents<EventType> {
	return {
		id: row.id,
		seq: row.seq,
		type: row.type,
		payload: JSON.parse(row.payload),
		occurredAt: row.occurred_at,
		correlationId: row.correlation_id ?? undefined,
		causationId: row.causation_id ?? undefined,
	} as AllEvents<EventType>;
}
