import type { AllEvents, EventType, Session } from "@omnia/contracts";
import type { Projector } from "./types.js";

export class SessionProjector implements Projector<Map<string, Session>> {
	state: Map<string, Session> = new Map();

	apply(event: AllEvents<EventType>): void {
		switch (event.type) {
			case "session.created": {
				this.state.set(event.payload.sessionId, {
					id: event.payload.sessionId,
					provider: event.payload.provider,
					title: event.payload.title,
					status: "idle",
					workspaceId: event.payload.workspacePath,
					createdAt: event.payload.createdAt,
					updatedAt: event.payload.createdAt,
				});
				break;
			}
			case "session.renamed": {
				const session = this.state.get(event.payload.sessionId);
				if (!session) break;
				if (event.payload.source === "provider" && session.titleSource === "user") break;

				this.state.set(session.id, {
					...session,
					title: event.payload.title,
					titleSource: event.payload.source,
					updatedAt: event.occurredAt,
				});
				break;
			}
			case "session.deleted": {
				this.state.delete(event.payload.sessionId);
				break;
			}
			case "turn.started": {
				const session = this.state.get(event.payload.sessionId);
				if (session) {
					this.state.set(session.id, {
						...session,
						status: "running",
						model: event.payload.model ?? session.model,
						effort: event.payload.effort ?? session.effort,
						updatedAt: event.occurredAt,
					});
				}
				break;
			}
			case "turn.completed":
			case "turn.canceled":
			case "turn.failed": {
				const session = this.state.get(event.payload.sessionId);
				if (session) {
					this.state.set(session.id, {
						...session,
						status: event.type === "turn.failed" ? "error" : "idle",
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
