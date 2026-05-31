import { AgentEvent, Provider, Session } from "@omnia/contracts";
import { AIProvider } from "./base.js";
import { ClaudeProvider } from "./claude/index.js";

export class ProviderService {
	provider: AIProvider | null;

	constructor() {
		this.provider = null;
	}

	async createSession(provider: Provider): Promise<Session> {
		this.setProviderInstance(provider);
		if (!this.provider) throw new Error("No provider set");
		const session = await this.provider.createSession(provider);
		return session;
	}

	sendMessage(sessionId: string, message: string): AsyncGenerator<AgentEvent> {
		if (!this.provider) throw new Error("No provider set");
		return this.provider.sendMessage(sessionId, message);
	}

	confirm(sessionId: string, toolCallId: string, approved: boolean): void {
		if (!this.provider) throw new Error("No provider set");
		this.provider.confirm(sessionId, toolCallId, approved);
	}

	getSessions(): Session[] {
		if (!this.provider) throw new Error("No provider set");
		return this.provider.getSessions();
	}

	getEvents(sessionId: string): AgentEvent[] {
		if (!this.provider) throw new Error("No provider set");
		return this.provider.getEvents(sessionId);
	}

	detectProviders(): Provider[] {
		const providers = this.detectAllAvailableProviders();
		return providers;
	}

	private detectAllAvailableProviders(): Provider[] {
		const providers: Provider[] = [];
		if (this.detectProviderAvailability("claude")) providers.push("claude");
		if (this.detectProviderAvailability("gemini")) providers.push("gemini");
		if (this.detectProviderAvailability("codex")) providers.push("codex");
		if (this.detectProviderAvailability("opencode")) providers.push("opencode");
		if (this.detectProviderAvailability("cursor")) providers.push("cursor");
		return providers;
	}

	private detectProviderAvailability(provider: Provider): boolean {
		try {
			switch (provider) {
				case "claude":
					return ClaudeProvider.isAvailable();
				case "gemini":
					return true;
				case "codex":
					return true;
				case "opencode":
					return true;
				case "cursor":
					return true;
				default:
					return false;
			}
		} catch {
			return false;
		}
	}

	private setProviderInstance(provider: Provider) {
		switch (provider) {
			// case "claude":
			//   this.provider = new ClaudeProvider();
			//   break;
			// case "gemini":
			//   this.provider = new GeminiProvider();
			//   break;
			default:
				throw new Error(`Unsupported provider: ${provider}`);
		}
	}
}

export const providerService = new ProviderService();
