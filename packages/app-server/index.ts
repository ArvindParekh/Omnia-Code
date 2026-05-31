import { ProviderRegistry } from "@omnia/providers";
import { CommandRouter } from "./command-router";
import { createEvent, EventStore } from "./event-store";
import { sessionProjector, turnProjector } from "./projections";
import { SessionService } from "./services/session-service";
import { TurnService } from "./services/turn-service";

const router = new CommandRouter();
const eventStore = EventStore.getInstance();
const registry = new ProviderRegistry();
const sessionService = new SessionService(registry, eventStore);
const turnService = new TurnService(sessionService, registry, eventStore);

router
	.use(async (envelope, next) => {
		console.log(`[${envelope.requestedAt}] dispatching ${envelope.type} (id=${envelope.id})`);
		await next();
	})
	.use(async (envelope, next) => {
		if (envelope.requestedBy === "user") {
			// auth check, rate limiting, etc.
		}
		await next();
	})
	.on("session.createRequested", async (envelope) => {
		const ev = createEvent("session.created", {
			sessionId: envelope.id,
			provider: envelope.payload.provider,
			workspacePath: envelope.payload.workspacePath,
			title: envelope.payload.title ?? "",
			createdAt: Date.now(),
		});
		eventStore.addEvent(ev);
		const sessionId = crypto.randomUUID();
		await sessionService.create({ ...envelope, id: sessionId });
	})
	.on("turn.startRequested", async (envelope) => {
		const ev = createEvent("turn.started", {
			sessionId: envelope.payload.sessionId,
			provider: "claude",
			startedAt: Date.now(),
			turnId: envelope.id,
		});
		eventStore.addEvent(ev);
		await turnService.start(envelope);
	})
	.on("turn.cancelRequested", async (envelope) => {
		const ev = createEvent("turn.canceled", {
			sessionId: envelope.payload.sessionId,
			turnId: envelope.id,
			canceledAt: Date.now(),
		});
		eventStore.addEvent(ev);
		await turnService.cancel(envelope);
	})
	.on("approval.resolveRequested", async (envelope) => {
		const ev = createEvent("approval.resolved", {
			approvalId: envelope.payload.approvalId,
			approved: envelope.payload.approved,
			note: envelope.payload.note,
		});
		eventStore.addEvent(ev);
		// await approvalService.resolve(envelope.payload.approvalId, envelope.payload.approved);
	});

export const appServer = {
	router,
	eventStore,
	sessionProjector,
	turnProjector,
};
