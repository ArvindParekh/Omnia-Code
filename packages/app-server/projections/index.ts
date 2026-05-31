import { ProjectionPipeline } from "./projection-pipeline";
import { SessionProjector } from "./projectors/session-projector";
import { TurnProjector } from "./projectors/turn-projector";
import { EventStore } from "../event-store";

const eventStore = EventStore.getInstance();
const projectionPipeline = new ProjectionPipeline(eventStore);
export const sessionProjector = projectionPipeline.register(new SessionProjector());
export const turnProjector = projectionPipeline.register(new TurnProjector());
