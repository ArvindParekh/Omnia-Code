import type {
	CommandEnvelopeFor,
	EventStore,
	ProviderSessionRef,
	SessionPolicy,
} from "@omnia/contracts";
import type { ProviderRegistry } from "@omnia/providers";

export type ProviderSession = {
	ref: ProviderSessionRef;
	workspacePath: string;
	policy: SessionPolicy;
};

export class SessionService {
	private providerSessions = new Map<string, ProviderSession>();

	constructor(
		private readonly registry: ProviderRegistry,
		private readonly eventStore: EventStore,
	) {}

	async create(envelope: CommandEnvelopeFor<"session.createRequested">): Promise<ProviderSession> {
		const { provider, workspacePath } = envelope.payload;
		const sessionId = envelope.id;
		const adapter = this.registry.get(provider);
		const policy: SessionPolicy = {
			capabilities: [],
		};

		const ref = await adapter.createSession({
			sessionId,
			workspacePath,
			policy,
		});

		const session = {
			ref,
			workspacePath,
			policy,
		};
		this.providerSessions.set(sessionId, session);

		return session;
	}

	getProviderSession(sessionId: string): ProviderSession {
		const session = this.providerSessions.get(sessionId);
		if (!session) throw new Error(`No provider session found for session ${sessionId}`);
		return session;
	}

	async rehydrate(): Promise<void> {
		for (const event of this.eventStore.getEventsByType("session.created")) {
			const { sessionId, ref, workspacePath, policy } = event.payload;

			const session = { ref, workspacePath, policy };
			this.providerSessions.set(sessionId, session);

			await this.registry.get(ref.provider).resumeSession({
				sessionId,
				providerSessionRef: ref,
				workspacePath,
				policy,
			});
		}
	}
}
