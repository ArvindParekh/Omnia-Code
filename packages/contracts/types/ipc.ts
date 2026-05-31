import type { Provider } from "./provider";
import type { Session, AgentEvent } from "./session";

export type IpcChannels = {
  "agent:createSession": {
    args: {
      provider: Provider;
    };
    result: Promise<Session>;
  };
  "agent:sendMessage": {
    args: {
      sessionId: string;
      message: string;
    };
    result: void;
  };
  "agent:confirm": {
    args: {
      sessionId: string;
      toolCallId: string;
      approved: boolean;
    };
    result: void;
  };
  "agent:getSessions": {
    args: Record<string, never>;
    result: Session[];
  };
  "agent:getEvents": {
    args: {
      sessionId: string;
    };
    result: AgentEvent[];
  };
  "agent:detectProviders": {
    args: Record<string, never>;
    result: Provider[];
  };
};

export type IpcEvents = {
  "agent:event": { sessionId: string; event: AgentEvent };
  "agent:sessionUpdated": { session: Session };
};
