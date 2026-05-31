import type { EventStore } from "../event-store";
import type { Projector } from "./projectors/types";

export class ProjectionPipeline {
  private projectors: Projector<unknown>[] = [];

  constructor(private readonly eventStore: EventStore) {
    this.eventStore.subscribe((event) => {
      for (const projector of this.projectors) {
        projector.apply(event)
      }
    })
  }

  register<TState>(projector: Projector<TState>): Projector<TState> {
    projector.replayAll(this.eventStore.getEvents());
    this.projectors.push(projector);
    return projector;
  }
}
