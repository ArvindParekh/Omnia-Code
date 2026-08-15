import type { EventStore } from "@omnia/contracts";
import { ProjectionPipeline } from "./projection-pipeline.js";
import { SessionProjector } from "./projectors/session-projector.js";
import { TurnProjector } from "./projectors/turn-projector.js";

// registering a projector replays the store's existing events into it, so
// we call this during boot to restore projections from the persisted log.
export function createProjections(eventStore: EventStore) {
	const pipeline = new ProjectionPipeline(eventStore);
	return {
		sessionProjector: pipeline.register(new SessionProjector()),
		turnProjector: pipeline.register(new TurnProjector()),
	};
}
