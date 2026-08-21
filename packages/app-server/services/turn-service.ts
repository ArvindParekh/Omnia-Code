import type {
	AllDraftEvents,
	CommandEnvelopeFor,
	EffortLevel,
	EventStore,
	EventType,
	MessageAttachment,
	ModelSelection,
	ProviderRuntimeEvent,
	QuoteRef,
} from "@omnia/contracts";
import type { CancelProviderTurnInput, ProviderAdapter, ProviderRegistry } from "@omnia/providers";
import type { ProviderSessionRef, SessionPolicy } from "@omnia/contracts";
import { createEvent } from "../create-event.js";
import type { SessionService } from "./session-service.js";

type ActiveTurn = {
	abortController: AbortController;
	adapter: ProviderAdapter;
	cancelInput: CancelProviderTurnInput;
};

export class TurnService {
	private activeTurns = new Map<string, ActiveTurn>();

	constructor(
		private readonly sessionService: SessionService,
		private readonly registry: ProviderRegistry,
		private readonly eventStore: EventStore,
	) { }

	async start(
		envelope: CommandEnvelopeFor<"turn.startRequested">,
		causationIdSeed: string,
	): Promise<void> {
		const { sessionId, text, attachments, quote, model, effort } = envelope.payload;
		const turnId = envelope.payload.turnId;
		const {
			ref: providerRef,
			workspacePath,
			policy,
		} = this.sessionService.getProviderSession(sessionId);
		const adapter = this.registry.get(providerRef.provider);
		// Scoped to the session so this is an indexed range scan, not a full log read.
		const resume = this.eventStore
			.getEvents(sessionId)
			.some((event) => event.type === "turn.started" && event.payload.turnId !== turnId);

		const abortController = new AbortController();
		this.activeTurns.set(turnId, {
			abortController,
			adapter,
			cancelInput: {
				sessionId,
				providerSessionRef: providerRef,
				turnId,
				workspacePath,
				policy,
				signal: abortController.signal,
			},
		});

		// Run asynchronously so the command returns while provider events continue streaming.
		void this.runStream({
			adapter,
			providerRef,
			sessionId,
			turnId,
			text,
			attachments: attachments ?? [],
			quote,
			model,
			effort,
			workspacePath,
			policy,
			resume,
			signal: abortController.signal,
			causationIdSeed,
		});
	}

	async cancel(envelope: CommandEnvelopeFor<"turn.cancelRequested">): Promise<void> {
		const active = this.activeTurns.get(envelope.payload.turnId);
		if (!active) return;

		active.abortController.abort();
		try {
			await active.adapter.cancelTurn(active.cancelInput);
		} finally {
			this.activeTurns.delete(envelope.payload.turnId);
		}
	}

	private async runStream(opts: {
		adapter: ProviderAdapter;
		providerRef: ProviderSessionRef;
		sessionId: string;
		turnId: string;
		text: string;
		attachments: MessageAttachment[];
		quote?: QuoteRef;
		model?: ModelSelection;
		effort?: EffortLevel;
		workspacePath: string;
		policy: SessionPolicy;
		resume: boolean;
		signal: AbortSignal;
		causationIdSeed: string;
	}): Promise<void> {
		const {
			adapter,
			providerRef,
			sessionId,
			turnId,
			text,
			attachments,
			quote,
			model,
			effort,
			workspacePath,
			policy,
			resume,
			signal,
			causationIdSeed,
		} = opts;
		const cursor = {
			lastEventId: causationIdSeed,
		};
		const toolCauseId: Map<string, string> = new Map(); // toolCallId -> the tool.callStarted event that opened it
		const blockCauseId: Map<string, string> = new Map(); // blockId -> the event that caused the block to open
		try {
			// One assistant/reasoning message per provider content block. A single
			// id per turn would merge text emitted after a tool call back into the
			// message that preceded it.
			const messageIds = new Map<string, string>();
			const messageIdFor = (blockId: string): string => {
				const existing = messageIds.get(blockId);
				if (existing) return existing;

				const created = crypto.randomUUID();
				messageIds.set(blockId, created);
				return created;
			};
			let failed = false;

			const stream = adapter.sendTurn({
				sessionId,
				turnId,
				text,
				attachments,
				quote,
				model,
				effort,
				providerSessionRef: providerRef,
				workspacePath,
				policy,
				resume,
				signal,
			});

			for await (const runtimeEvent of stream) {
				if (signal.aborted) break;
				if (runtimeEvent.type === "runtime.failed") failed = true;
				this.mapAndAppend(runtimeEvent, {
					sessionId,
					turnId,
					cursor,
					toolCauseId,
					blockCauseId,
					messageIdFor,
				});
			}

			if (!signal.aborted && !failed) {
				this.eventStore.addEvent(
					createEvent(
						"turn.completed",
						{
							sessionId,
							turnId,
							completedAt: Date.now(),
						},
						{ causationId: cursor.lastEventId, correlationId: turnId },
					),
				);
			}
		} catch (error) {
			if (opts.signal.aborted) return;

			console.error(`[turn:${opts.turnId}]`, error);

			this.eventStore.addEvent(
				createEvent(
					"turn.failed",
					{
						sessionId: opts.sessionId,
						turnId: opts.turnId,
						message: `Turn failed. Ref: ${turnId}`,
						retryable: true,
						correlationId: turnId,
					},
					{ causationId: cursor.lastEventId, correlationId: turnId },
				),
			);
		} finally {
			this.activeTurns.delete(opts.turnId);
		}
	}

	private mapAndAppend(
		event: ProviderRuntimeEvent,
		ctx: {
			sessionId: string;
			turnId: string;
			cursor: { lastEventId: string };
			toolCauseId: Map<string, string>;
			blockCauseId: Map<string, string>;
			messageIdFor: (blockId: string) => string;
		},
	) {
		const { sessionId, turnId, cursor, toolCauseId, blockCauseId, messageIdFor } = ctx;
		const meta = { correlationId: turnId }; // causationId is per-case, correlationId is fixed to turnId for all events

		let newEvent: AllDraftEvents<EventType> | undefined = undefined;

		switch (event.type) {
			case "assistant.delta":
				if (blockCauseId.has(event.blockId)) {
					// rest of the blocks
					newEvent = createEvent(
						"message.assistantDeltaReceived",
						{
							sessionId,
							turnId,
							messageId: messageIdFor(event.blockId),
							text: event.text,
						},
						{
							...meta,
							causationId: blockCauseId.get(event.blockId),
						},
					);
				} else {
					// first block
					newEvent = createEvent(
						"message.assistantDeltaReceived",
						{
							sessionId,
							turnId,
							messageId: messageIdFor(event.blockId),
							text: event.text,
						},
						{
							...meta,
							causationId: cursor.lastEventId,
						},
					);
					blockCauseId.set(event.blockId, cursor.lastEventId);
					cursor.lastEventId = newEvent.id;
				}
				this.eventStore.addEvent(newEvent);
				break;
			case "session.titleSuggested":
				this.eventStore.addEvent(
					createEvent(
						"session.renamed",
						{
							sessionId,
							title: event.title,
							source: "provider",
						},
						{
							...meta,
							causationId: cursor.lastEventId,
						},
					),
				);
				break;
			case "assistant.completed":
				newEvent = createEvent(
					"message.assistantCompleted",
					{
						sessionId,
						turnId,
						messageId: messageIdFor(event.blockId),
					},
					{
						...meta,
						causationId: blockCauseId.get(event.blockId) ?? cursor.lastEventId,
					},
				);
				this.eventStore.addEvent(newEvent);
				break;
			case "reasoning.delta":
				if (blockCauseId.has(event.blockId)) {
					// rest of the blocks
					newEvent = createEvent(
						"message.reasoningDeltaReceived",
						{
							sessionId,
							turnId,
							messageId: messageIdFor(event.blockId),
							text: event.text,
						},
						{
							...meta,
							causationId: blockCauseId.get(event.blockId),
						},
					);
				} else {
					// new block
					newEvent = createEvent(
						"message.reasoningDeltaReceived",
						{
							sessionId,
							turnId,
							messageId: messageIdFor(event.blockId),
							text: event.text,
						},
						{
							...meta,
							causationId: cursor.lastEventId,
						},
					);
					blockCauseId.set(event.blockId, cursor.lastEventId);
					cursor.lastEventId = newEvent.id;
				}
				this.eventStore.addEvent(newEvent);
				break;
			case "tool.started":
				newEvent = createEvent(
					"tool.callStarted",
					{
						sessionId,
						turnId,
						toolCallId: event.toolCallId,
						toolName: event.toolName,
						input: event.input,
						risk: event.risk,
					},
					{
						...meta,
						causationId: cursor.lastEventId,
					},
				);
				this.eventStore.addEvent(newEvent);
				toolCauseId.set(event.toolCallId, newEvent.id);
				break;
			case "tool.completed":
				newEvent = createEvent(
					"tool.callCompleted",
					{
						sessionId,
						turnId,
						toolCallId: event.toolCallId,
						output: event.output,
						isError: event.isError,
					},
					{
						...meta,
						causationId: toolCauseId.get(event.toolCallId) ?? cursor.lastEventId,
					},
				);
				this.eventStore.addEvent(newEvent);
				toolCauseId.delete(event.toolCallId);
				cursor.lastEventId = newEvent.id;
				break;
			case "approval.requested":
				newEvent = createEvent(
					"approval.requested",
					{
						approvalId: event.approvalId,
						sessionId,
						turnId,
						toolCallId: event.toolCallId,
						toolName: event.toolName,
						input: event.input,
						risk: event.risk,
					},
					{
						...meta,
						causationId: toolCauseId.get(event.toolCallId) ?? cursor.lastEventId,
					},
				);
				this.eventStore.addEvent(newEvent);
				break;
			case "runtime.failed":
				newEvent = createEvent(
					"turn.failed",
					{
						sessionId,
						turnId,
						message: event.message,
						retryable: event.retryable,
						correlationId: event.providerCorrelationId,
					},
					{
						...meta,
						causationId: cursor.lastEventId,
					},
				);
				this.eventStore.addEvent(newEvent);
				break;
			case "usage.metered":
				newEvent = createEvent(
					"cost.metered",
					{
						sessionId,
						turnId,
						requestId: event.blockId ?? undefined,
						scope: event.scope,
						usage: event.usage,
						modelUsage: event.modelUsage,
						totalCostUsd: event.totalCostUsd,
					},
					{
						...meta,
						causationId: cursor.lastEventId,
					},
				);
				this.eventStore.addEvent(newEvent);
				break;
		}
	}
}
