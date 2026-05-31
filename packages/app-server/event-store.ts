import type { AllEvents, EventType, EventPayload, DomainEventFor } from "@omnia/contracts";

// a minimal in-memory event store for now
export class EventStore {
	private events: AllEvents<EventType>[] = [];
	private listeners: ((event: AllEvents<EventType>) => void)[] = [];
	private static instance: EventStore;

	static getInstance(): EventStore {
		if (!EventStore.instance) EventStore.instance = new EventStore();
		return EventStore.instance;
	}

	addEvent(event: AllEvents<EventType>): void {
		this.events.push(event);
		for (const listener of this.listeners) listener(event);
	}

	subscribe(listener: (event: AllEvents<EventType>) => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener); //unsub
		};
	}

	getEvents(): AllEvents<EventType>[] {
		return [...this.events];
	}
}

let _seq = 1;
export function createEvent<K extends EventType>(
	type: K,
	payload: EventPayload<K>,
): DomainEventFor<K> {
	return { id: `e${_seq}`, seq: _seq++, type, payload, occurredAt: Date.now() };
}
