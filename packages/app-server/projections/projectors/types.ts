import type { AllEvents, EventType } from "@omnia/contracts";

export interface Projector<TState> {
	readonly state: TState;
	apply(event: AllEvents<EventType>): void;
	replayAll(events: AllEvents<EventType>[]): void;
}
