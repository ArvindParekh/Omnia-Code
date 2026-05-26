type Provider = "google" | "claude" | "codex" | "opencode" | "cursor";

type SessionStatus = "idle" | "running" | "error";

type Session = {
  id: string;
  provider: Provider;
  title: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
};

type AgentEvent =
  | { id: string; type: "text"; content: string; streaming: boolean }
  | {
      id: string;
      type: "tool_call";
      tool: string;
      args: unknown;
      status: "running" | "done" | "error";
    }
  | {
      id: string;
      type: "tool_result";
      toolCallId: string;
      content: string;
      isError: boolean;
    }
  | {
      id: string;
      type: "confirmation_request";
      toolCallId: string;
      tool: string;
      args: unknown;
      status: "pending" | "approved" | "rejected";
    }
  | { id: string; type: "error"; message: string };

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
