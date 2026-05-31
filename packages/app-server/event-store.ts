import type { AllEvents, EventType, EventPayload, DomainEventFor } from "@omnia/contracts";

// a minimal in-memory event store for now
export class EventStore {
  private events: AllEvents<EventType>[] = [];

  addEvent(event: AllEvents<EventType>): void {
    this.events.push(event);
  }

  getEvents(): AllEvents<EventType>[] {
    return [...this.events];
  }
}

let _seq = 1;
export function createEvent<K extends EventType>(type: K, payload: EventPayload<K>): DomainEventFor<K> {
  return { id: `e${_seq}`, seq: _seq++, type, payload, occurredAt: Date.now() };
}
