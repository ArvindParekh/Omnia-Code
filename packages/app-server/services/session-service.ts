import type { CommandEnvelopeFor } from "@omnia/contracts";
import type { ProviderRegistry, ProviderSessionRef, SessionPolicy } from "@omnia/providers";

type ProviderSession = {
	ref: ProviderSessionRef;
	workspacePath: string;
	policy: SessionPolicy;
};

export class SessionService {
	private providerSessions = new Map<string, ProviderSession>();

	constructor(private readonly registry: ProviderRegistry) {}

	async create(envelope: CommandEnvelopeFor<"session.createRequested">): Promise<void> {
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

		this.providerSessions.set(sessionId, {
			ref,
			workspacePath,
			policy,
		});
	}

	getProviderSession(sessionId: string): ProviderSession {
		const session = this.providerSessions.get(sessionId);
		if (!session) throw new Error(`No provider session found for session ${sessionId}`);
		return session;
	}
}
