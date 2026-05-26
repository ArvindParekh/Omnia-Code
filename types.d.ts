import type { Provider, Session, AgentEvent } from "./src/shared/types.ts";
type UnsubscribeFunction = () => void;

type IpcChannels = {
  "agent:createSession": {
    args: {
      provider: Provider;
    };
    result: Session;
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
    args: {};
    result: Session[];
  };
  "agent:getEvents": {
    args: {
      sessionId: string;
    };
    result: AgentEvent[];
  };
  "agent:detectProviders": {
    args: {};
    result: Provider[];
  };
};

type IpcEvents = {
  "agent:event": { sessionId: string; event: AgentEvent };
  "agent:sessionUpdated": { session: Session };
};

interface Window {
  omnia: {
    invoke: <C extends keyof IpcChannels>(
      channel: C,
      args: IpcChannels[C]["args"],
    ) => Promise<IpcChannels[C]["result"]>;

    on: <E extends keyof IpcEvents>(
      channel: E,
      callback: (payload: IpcEvents[E]) => void,
    ) => UnsubscribeFunction;
  };
}
