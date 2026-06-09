import { ClaudeProvider, fakeProviderAdapter, ProviderRegistry } from "@omnia/providers";
import { CommandRouter } from "./command-router.js";
import { createEvent, EventStore } from "./event-store.js";
import { sessionProjector, turnProjector } from "./projections/index.js";
import { SessionService } from "./services/session-service.js";
import { TurnService } from "./services/turn-service.js";

const router = new CommandRouter();
const eventStore = EventStore.getInstance();
const registry = new ProviderRegistry();
registry.register(fakeProviderAdapter).register(new ClaudeProvider());
const sessionService = new SessionService(registry);
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
		await sessionService.create({ ...envelope, id: envelope.id });
	})
	.on("turn.startRequested", async (envelope) => {
		const session = sessionProjector.state.get(envelope.payload.sessionId);
		if (!session)
			throw new Error(`Cannot start turn: session ${envelope.payload.sessionId} not found`);

		const ev = createEvent("turn.started", {
			sessionId: envelope.payload.sessionId,
			provider: session.provider,
			startedAt: Date.now(),
			turnId: envelope.payload.turnId,
		});
		eventStore.addEvent(ev);
		await turnService.start(envelope);
	})
	.on("turn.cancelRequested", async (envelope) => {
		await turnService.cancel(envelope);
		const ev = createEvent("turn.canceled", {
			sessionId: envelope.payload.sessionId,
			turnId: envelope.payload.turnId,
			canceledAt: Date.now(),
		});
		eventStore.addEvent(ev);
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
	registry,
};
