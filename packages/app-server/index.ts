import type { EventStore } from "@omnia/contracts";
import { ClaudeProvider, fakeProviderAdapter, ProviderRegistry } from "@omnia/providers";
import { CommandRouter } from "./command-router.js";
import { createEvent } from "./create-event.js";
import { createProjections } from "./projections/index.js";
import { ApprovalService } from "./services/approval-service.js";
import { SessionService } from "./services/session-service.js";
import { TurnService } from "./services/turn-service.js";

export type AppServer = ReturnType<typeof createAppServer>;

export function createAppServer(deps: { eventStore: EventStore }): {
	router: CommandRouter;
	eventStore: EventStore;
	sessionProjector: ReturnType<typeof createProjections>["sessionProjector"];
	turnProjector: ReturnType<typeof createProjections>["turnProjector"];
	registry: ProviderRegistry;
} {
	const { eventStore } = deps;

	const router = new CommandRouter();
	const registry = new ProviderRegistry();
	registry.register(fakeProviderAdapter).register(new ClaudeProvider());

	const { sessionProjector, turnProjector } = createProjections(eventStore);

	const sessionService = new SessionService(registry);
	const turnService = new TurnService(sessionService, registry, eventStore);
	const approvalService = new ApprovalService(sessionService, registry, eventStore);

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
			eventStore.addEvent(
				createEvent("session.created", {
					sessionId: envelope.id,
					provider: envelope.payload.provider,
					workspacePath: envelope.payload.workspacePath,
					title: envelope.payload.title ?? "",
					createdAt: Date.now(),
				}),
			);
			await sessionService.create({ ...envelope, id: envelope.id });
		})
		.on("turn.startRequested", async (envelope) => {
			const session = sessionProjector.state.get(envelope.payload.sessionId);
			if (!session)
				throw new Error(`Cannot start turn: session ${envelope.payload.sessionId} not found`);

			eventStore.addEvent(
				createEvent("turn.started", {
					sessionId: envelope.payload.sessionId,
					provider: session.provider,
					startedAt: Date.now(),
					turnId: envelope.payload.turnId,
				}),
			);

			eventStore.addEvent(
				createEvent("message.userCreated", {
					sessionId: envelope.payload.sessionId,
					turnId: envelope.payload.turnId,
					messageId: crypto.randomUUID(),
					text: envelope.payload.text,
					attachments: envelope.payload.attachments ?? [],
				}),
			);

			await turnService.start(envelope);
		})
		.on("turn.cancelRequested", async (envelope) => {
			await turnService.cancel(envelope);
			eventStore.addEvent(
				createEvent("turn.canceled", {
					sessionId: envelope.payload.sessionId,
					turnId: envelope.payload.turnId,
					canceledAt: Date.now(),
				}),
			);
		})
		.on("approval.resolveRequested", async (envelope) => {
			eventStore.addEvent(
				createEvent("approval.resolved", {
					approvalId: envelope.payload.approvalId,
					approved: envelope.payload.approved,
					note: envelope.payload.note,
				}),
			);
			await approvalService.resolve(envelope);
		});

	return { router, eventStore, sessionProjector, turnProjector, registry };
}
