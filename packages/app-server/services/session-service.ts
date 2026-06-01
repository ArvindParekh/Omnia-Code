import { ProviderRegistry, type ProviderSessionRef } from "@omnia/providers";
import type { EventStore } from "../event-store.js";
import type { CommandEnvelopeFor } from "@omnia/contracts";

export class SessionService {
	private providerRefs = new Map<string, ProviderSessionRef>();

	constructor(
		private readonly registry: ProviderRegistry,
		private readonly eventStore: EventStore,
	) {}

	async create(envelope: CommandEnvelopeFor<"session.createRequested">): Promise<void> {
		const { provider, workspacePath } = envelope.payload;

		const sessionId = envelope.id;

		const adapter = this.registry.get(provider);

		const ref = await adapter.createSession({
			sessionId,
			workspacePath,
			policy: {
				capabilities: [],
			},
		});

		this.providerRefs.set(sessionId, ref);
	}

	getProviderRef(sessionId: string): ProviderSessionRef {
		const ref = this.providerRefs.get(sessionId);
		if (!ref) throw new Error(`No provider ref found for session ${sessionId}`);
		return ref;
	}
}
