import type { AllEvents, EventType, Turn } from "@omnia/contracts";
import type { Projector } from "./types.js";

export class TurnProjector implements Projector<Map<string, Turn>> {
	state: Map<string, Turn> = new Map();

	apply(event: AllEvents<EventType>): void {
		switch (event.type) {
			case "turn.started": {
				this.state.set(event.payload.turnId, {
					id: event.payload.turnId,
					sessionId: event.payload.sessionId,
					userMessage: "", //todo
					status: "in_progress",
					agentEvents: [], //todo
					createdAt: event.payload.startedAt,
					updatedAt: event.payload.startedAt,
				});
				break;
			}
			case "turn.completed": {
				const turn = this.state.get(event.payload.turnId);
				if (turn) {
					this.state.set(event.payload.turnId, {
						...turn,
						status: "completed",
						updatedAt: event.payload.completedAt,
					});
				}
				break;
			}
			case "turn.canceled": {
				const turn = this.state.get(event.payload.turnId);
				if (turn) {
					this.state.set(event.payload.turnId, {
						...turn,
						status: "canceled",
						updatedAt: event.payload.canceledAt,
					});
				}
				break;
			}
			case "turn.failed": {
				const turn = this.state.get(event.payload.turnId);
				if (turn) {
					this.state.set(event.payload.turnId, {
						...turn,
						status: "failed",
						updatedAt: event.occurredAt,
					});
				}
				break;
			}
		}
	}

	replayAll(events: AllEvents<EventType>[]): void {
		this.state.clear();
		for (const event of events) this.apply(event);
	}
}
