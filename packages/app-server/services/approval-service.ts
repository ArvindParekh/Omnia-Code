import type { CommandEnvelopeFor, DomainEventFor, EventStore } from "@omnia/contracts";
import type { ProviderRegistry } from "@omnia/providers";
import type { SessionService } from "./session-service.js";

export class ApprovalService {
	constructor(
		private readonly sessionService: SessionService,
		private readonly registry: ProviderRegistry,
		private readonly eventStore: EventStore,
	) {}

	async resolve(envelope: CommandEnvelopeFor<"approval.resolveRequested">): Promise<void> {
		const { approvalId, approved, note } = envelope.payload;

		const requested = this.eventStore
			.getEvents()
			.find(
				(event): event is DomainEventFor<"approval.requested"> =>
					event.type === "approval.requested" && event.payload.approvalId === approvalId,
			);
		if (!requested) return;

		const { sessionId, turnId, toolCallId, toolName, input, risk } = requested.payload;
		const { ref: providerSessionRef } = this.sessionService.getProviderSession(sessionId);
		const adapter = this.registry.get(providerSessionRef.provider);

		await adapter.resolveApproval({
			sessionId,
			providerSessionRef,
			turnId,
			toolCallId,
			toolName,
			input,
			risk,
			approved,
			note,
		});
	}
}
