import type { DraftEvent, EventPayload, EventType } from "@omnia/contracts";

type EventMeta = {
	correlationId?: string;
	causationId?: string;
};

// this builds an unpersisted event. `seq` is assigned by the event store on append,
// so this returns a DraftEvent — holding a DomainEvent means it's durable.
export function createEvent<K extends EventType>(
	type: K,
	payload: EventPayload<K>,
	meta?: EventMeta,
): DraftEvent<K> {
	return {
		id: crypto.randomUUID(),
		type,
		payload,
		occurredAt: Date.now(),
		correlationId: meta?.correlationId,
		causationId: meta?.causationId,
	};
}
