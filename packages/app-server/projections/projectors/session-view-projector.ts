import type { AllEvents, EventType, SessionView, SessionViewItem } from "@omnia/contracts";
import type { Projector } from "./types";

type ItemOfKind<K extends SessionViewItem["kind"]> = Extract<SessionViewItem, { kind: K }>;

function updateItem<K extends SessionViewItem["kind"]>(
	items: SessionViewItem[],
	kind: K,
	id: string,
	update: (item: ItemOfKind<K>) => ItemOfKind<K>,
): SessionViewItem[] {
	return items.map((item) =>
		item.kind === kind && item.id === id ? update(item as ItemOfKind<K>) : item,
	);
}

function appendText(
	items: SessionViewItem[],
	kind: "assistant" | "reasoning",
	id: string,
	turnId: string,
	text: string,
	createdAt: number,
): SessionViewItem[] {
	const exists = items.some((item) => item.kind === kind && item.id === id);
	if (!exists) {
		return [...items, { kind, id, turnId, text, streaming: true, createdAt }];
	}
	return updateItem(items, kind, id, (item) => ({ ...item, text: item.text + text }));
}

function clearStreaming(items: SessionViewItem[], turnId: string): SessionViewItem[] {
	return items.map((item) =>
		(item.kind === "assistant" || item.kind === "reasoning") &&
		item.streaming &&
		item.turnId === turnId
			? { ...item, streaming: false }
			: item,
	);
}

export class SessionViewProjector implements Projector<Map<string, SessionView>> {
	state: Map<string, SessionView> = new Map();

	apply(event: AllEvents<EventType>): void {
		if (event.type === "session.created") {
			this.state.set(event.payload.sessionId, {
				sessionId: event.payload.sessionId,
				lastSeq: event.seq,
				items: [],
			});
			return;
		}

		if (!("sessionId" in event.payload)) return;

		const { sessionId } = event.payload;
		const existing = this.state.get(sessionId);
		if (!existing) return;

		this.state.set(sessionId, {
			sessionId,
			lastSeq: event.seq,
			items: this.nextItems(existing.items, event),
		});
	}

	replayAll(events: AllEvents<EventType>[]): void {
		this.state.clear();
		for (const e of events) this.apply(e);
	}

	private nextItems(items: SessionViewItem[], event: AllEvents<EventType>): SessionViewItem[] {
		switch (event.type) {
			case "turn.started": {
				const selection = event.payload.model;
				if (!selection || selection.mode !== "explicit") return items;

				const previous = [...items].reverse().find((item) => item.kind === "model");
				const unchanged =
					previous?.kind === "model" &&
					previous.modelId === selection.modelId &&
					previous.effort === event.payload.effort;
				if (unchanged) return items;

				return [
					...items,
					{
						kind: "model",
						id: `model-${event.id}`,
						turnId: event.payload.turnId,
						modelId: selection.modelId,
						effort: event.payload.effort,
						createdAt: event.occurredAt,
					},
				];
			}
			case "message.userCreated":
				return [
					...items,
					{
						kind: "user",
						id: event.payload.messageId,
						turnId: event.payload.turnId,
						text: event.payload.text,
						attachments: event.payload.attachments,
						quote: event.payload.quote,
						createdAt: event.occurredAt,
					},
				];
			case "message.assistantDeltaReceived":
				return appendText(
					items,
					"assistant",
					event.payload.messageId,
					event.payload.turnId,
					event.payload.text,
					event.occurredAt,
				);
			case "message.assistantCompleted":
				return updateItem(items, "assistant", event.payload.messageId, (item) => ({
					...item,
					streaming: false,
				}));
			case "message.reasoningDeltaReceived":
				return appendText(
					items,
					"reasoning",
					event.payload.messageId,
					event.payload.turnId,
					event.payload.text,
					event.occurredAt,
				);
			case "tool.callStarted":
				return [
					...items,
					{
						kind: "tool",
						id: event.payload.toolCallId,
						turnId: event.payload.turnId,
						name: event.payload.toolName,
						input: event.payload.input,
						risk: event.payload.risk,
						status: "running",
						createdAt: event.occurredAt,
					},
				];
			case "tool.callCompleted":
				return updateItem(items, "tool", event.payload.toolCallId, (item) => ({
					...item,
					status: event.payload.isError ? "error" : "done",
					output: event.payload.output,
				}));
			case "approval.requested":
				return [
					...items,
					{
						kind: "approval",
						id: event.payload.approvalId,
						turnId: event.payload.turnId,
						toolName: event.payload.toolName,
						input: event.payload.input,
						risk: event.payload.risk,
						resolved: false,
						createdAt: event.occurredAt,
					},
				];
			case "approval.resolved":
				return updateItem(items, "approval", event.payload.approvalId, (item) => ({
					...item,
					resolved: true,
					approved: event.payload.approved,
					note: event.payload.note,
				}));
			case "turn.completed":
			case "turn.canceled":
				return clearStreaming(items, event.payload.turnId);
			case "turn.failed":
				return [
					...clearStreaming(items, event.payload.turnId),
					{
						kind: "error",
						id: event.id,
						turnId: event.payload.turnId,
						message: event.payload.message,
						retryable: event.payload.retryable,
						correlationId: event.payload.correlationId,
						createdAt: event.occurredAt,
					},
				];
			default:
				return items;
		}
	}
}
