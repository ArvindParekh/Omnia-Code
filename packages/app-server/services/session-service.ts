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

	async rename(envelope: CommandEnvelopeFor<"session.renameRequested">): Promise<void> {
		const { sessionId, customTitle } = envelope.payload;

		const session = this.providerSessions.get(sessionId);
		if (!session) return;

		await this.registry.get(session.ref.provider).renameSession({
			sessionId,
			providerSessionRef: session.ref,
			customTitle,
		});
	}

	async delete(envelope: CommandEnvelopeFor<"session.deleteRequested">): Promise<void> {
		const { sessionId } = envelope.payload;
		const session = this.providerSessions.get(sessionId);
		if (!session) return;

		this.providerSessions.delete(sessionId);

		await this.registry.get(session.ref.provider).deleteSession({
			sessionId,
			providerSessionRef: session.ref,
		});
	}

	getProviderSession(sessionId: string): ProviderSession {
		const session = this.providerSessions.get(sessionId);
		if (!session) throw new Error(`No provider session found for session ${sessionId}`);
		return session;
	}

	async rehydrate(): Promise<void> {
		const deleted = new Set(
			this.eventStore.getEventsByType("session.deleted").map((event) => event.payload.sessionId),
		);

		for (const event of this.eventStore.getEventsByType("session.created")) {
			if (deleted.has(event.payload.sessionId)) continue;

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
