import type { AllEvents, EventStore, EventType } from "@omnia/contracts";

// A follow-up command (cancel, approval resolution) should stay correlated to
// the turn it acts on, not start a new correlation rooted at itself. The
// event it's reacting to already carries that id — this just reads it back.
export function findCorrelationId(
	eventStore: EventStore,
	sessionId: string,
	match: (event: AllEvents<EventType>) => boolean,
): string | undefined {
	const found = eventStore.getEvents(sessionId).find(match);
	return found?.correlationId ?? found?.id;
}
