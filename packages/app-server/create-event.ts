import type { DraftEvent, EventPayload, EventType } from "@omnia/contracts";

// this builds an unpersisted event. `seq` is assigned by the event store on append,
// so this returns a DraftEvent — holding a DomainEvent means it's durable.
export function createEvent<K extends EventType>(type: K, payload: EventPayload<K>): DraftEvent<K> {
	return { id: crypto.randomUUID(), type, payload, occurredAt: Date.now() };
}
