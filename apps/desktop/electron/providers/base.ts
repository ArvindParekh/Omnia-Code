import type { Provider, Session, AgentEvent } from "../../../../packages/contracts/types.js";

export interface AIProvider {
  readonly name: string;
  createSession(provider: Provider): Promise<Session>;
  sendMessage(sessionId: string, message: string): AsyncGenerator<AgentEvent>;
  confirm(sessionId: string, toolCallId: string, approved: boolean): void;
  getSessions(): Session[];
  getEvents(sessionId: string): AgentEvent[];
}
