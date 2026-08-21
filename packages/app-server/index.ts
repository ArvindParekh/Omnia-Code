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
	sessionViewProjector: ReturnType<typeof createProjections>["sessionViewProjector"];
	costProjector: ReturnType<typeof createProjections>["costProjector"];
	start: () => Promise<void>;
} {
	const { eventStore } = deps;

	const router = new CommandRouter();
	const registry = new ProviderRegistry();
	registry.register(fakeProviderAdapter).register(new ClaudeProvider());

	const { sessionProjector, turnProjector, sessionViewProjector, costProjector } =
		createProjections(eventStore);

	const sessionService = new SessionService(registry, eventStore);
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
			const { ref, workspacePath, policy } = await sessionService.create({
				...envelope,
				id: envelope.id,
			});
			eventStore.addEvent(
				createEvent(
					"session.created",
					{
						sessionId: envelope.id,
						provider: envelope.payload.provider,
						workspacePath,
						policy,
						ref,
						title: envelope.payload.title ?? "",
						createdAt: Date.now(),
					},
					{ causationId: undefined, correlationId: envelope.id },
				),
			);
		})
		.on("session.renameRequested", async (envelope) => {
			eventStore.addEvent(
				createEvent(
					"session.renamed",
					{
						sessionId: envelope.payload.sessionId,
						source: "user",
						title: envelope.payload.customTitle,
					},
					{ causationId: undefined, correlationId: envelope.id },
				),
			);

			try {
				await sessionService.rename(envelope);
			} catch (error) {
				console.error(`[rename:${envelope.payload.sessionId}]`, error);
			}
		})
		.on("session.deleteRequested", async (envelope) => {
			eventStore.addEvent(
				createEvent(
					"session.deleted",
					{
						sessionId: envelope.payload.sessionId,
					},
					{ causationId: undefined, correlationId: envelope.id },
				),
			);

			try {
				await sessionService.delete(envelope);
			} catch (error) {
				console.error(`[delete:${envelope.payload.sessionId}]`, error);
			}
		})
		.on("turn.startRequested", async (envelope) => {
			const session = sessionProjector.state.get(envelope.payload.sessionId);
			if (!session)
				throw new Error(`Cannot start turn: session ${envelope.payload.sessionId} not found`);

			const turnStartedEvent = createEvent(
				"turn.started",
				{
					sessionId: envelope.payload.sessionId,
					provider: session.provider,
					model: envelope.payload.model ?? session.model,
					effort: envelope.payload.effort ?? session.effort,
					startedAt: Date.now(),
					turnId: envelope.payload.turnId,
				},
				{ causationId: undefined, correlationId: envelope.id },
			);
			eventStore.addEvent(
				turnStartedEvent,
			);

			const userMessageEvent = createEvent(
				"message.userCreated",
				{
					sessionId: envelope.payload.sessionId,
					turnId: envelope.payload.turnId,
					messageId: crypto.randomUUID(),
					text: envelope.payload.text,
					attachments: envelope.payload.attachments ?? [],
					quote: envelope.payload.quote,
				},
				{ causationId: turnStartedEvent.id, correlationId: envelope.id },
			);
			eventStore.addEvent(
				userMessageEvent,
			);

			await turnService.start({
				...envelope,
				payload: {
					...envelope.payload,
					model: envelope.payload.model ?? session.model,
					effort: envelope.payload.effort ?? session.effort,
				},
			}, userMessageEvent.id);
		})
		.on("turn.cancelRequested", async (envelope) => {
			await turnService.cancel(envelope);
			eventStore.addEvent(
				createEvent(
					"turn.canceled",
					{
						sessionId: envelope.payload.sessionId,
						turnId: envelope.payload.turnId,
						canceledAt: Date.now(),
					},
					{ causationId: undefined, correlationId: envelope.payload.turnId },
				),
			);
		})
		.on("approval.resolveRequested", async (envelope) => {
			const approvalRequestedEvent = eventStore.getEventsByType("approval.requested").find(event => event.payload.approvalId === envelope.payload.approvalId);
			eventStore.addEvent(
				createEvent(
					"approval.resolved",
					{
						sessionId: envelope.payload.sessionId,
						approvalId: envelope.payload.approvalId,
						approved: envelope.payload.approved,
						note: envelope.payload.note,
					},
					{ causationId: approvalRequestedEvent?.id, correlationId: approvalRequestedEvent?.payload.turnId },
				),
			);
			await approvalService.resolve(envelope);
		});

	const start = () => sessionService.rehydrate();

	return {
		router,
		eventStore,
		sessionProjector,
		turnProjector,
		registry,
		sessionViewProjector,
		costProjector,
		start,
	};
}
