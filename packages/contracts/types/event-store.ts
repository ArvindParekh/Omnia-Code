import type { AllDraftEvents, AllEvents, EventType } from "./events";

export interface EventStore {
	addEvent(draft: AllDraftEvents<EventType>): AllEvents<EventType>;
	getEvents(sessionId?: string): AllEvents<EventType>[];
	subscribe(listener: (event: AllEvents<EventType>) => void): () => void;
}
