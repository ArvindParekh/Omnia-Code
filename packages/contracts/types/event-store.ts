import type { AllDraftEvents, AllEvents, DomainEventFor, EventType } from "./events";

export interface EventStore {
	addEvent(draft: AllDraftEvents<EventType>): AllEvents<EventType>;
	getEvents(sessionId?: string): AllEvents<EventType>[];
	getEventsByType<K extends EventType>(type: K): DomainEventFor<K>[];
	subscribe(listener: (event: AllEvents<EventType>) => void): () => void;
}
