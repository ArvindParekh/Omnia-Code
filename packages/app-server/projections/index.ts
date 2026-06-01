import { ProjectionPipeline } from "./projection-pipeline.js";
import { SessionProjector } from "./projectors/session-projector.js";
import { TurnProjector } from "./projectors/turn-projector.js";
import { EventStore } from "../event-store.js";

const eventStore = EventStore.getInstance();
const projectionPipeline = new ProjectionPipeline(eventStore);
export const sessionProjector = projectionPipeline.register(new SessionProjector());
export const turnProjector = projectionPipeline.register(new TurnProjector());
