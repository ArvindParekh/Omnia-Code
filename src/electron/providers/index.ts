import { AgentEvent, Provider, Session } from "../../shared/types.js";

export class ProviderService {
  provider: AIProvider | null;

  constructor() {
    this.provider = null;
  }

  createSession(provider: Provider): Session {
    this.setProviderInstance(provider);
    if (!this.provider) throw new Error("No provider set");
    const session = this.provider.createSession(provider);
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
          return true;
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

export interface AIProvider {
  createSession(provider: Provider): Session;
  sendMessage(sessionId: string, message: string): AsyncGenerator<AgentEvent>;
  confirm(sessionId: string, toolCallId: string, approved: boolean): void;
  getSessions(): Session[];
  getEvents(sessionId: string): AgentEvent[];
  detectProviders(): Provider[];
}
