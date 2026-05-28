type Provider = "gemini" | "claude" | "codex" | "opencode" | "cursor";

type SessionStatus = "idle" | "running" | "error";

type Session = {
  id: string;
  provider: Provider;
  title: string;
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
};

type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | {
      type: "error";
      message: string;
      retryable?: boolean;
      correlationId?: string;
    }
  | { type: "approval"; id: string; toolName: string; input: unknown };

type IpcChannels = {
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

type IpcEvents = {
  "agent:event": { sessionId: string; event: AgentEvent };
  "agent:sessionUpdated": { session: Session };
};

export type { Provider, Session, AgentEvent, IpcChannels, IpcEvents };
