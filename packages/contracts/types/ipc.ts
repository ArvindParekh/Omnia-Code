import type { Provider } from "./provider.ts";
import type { AgentEvent, Session } from "./session.ts";

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
		result: undefined;
	};
	"agent:confirm": {
		args: {
			sessionId: string;
			toolCallId: string;
			approved: boolean;
		};
		result: undefined;
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
	"window:minimize": {
		args: Record<string, never>;
		result: undefined;
	};
	"window:maximize": {
		args: Record<string, never>;
		result: undefined;
	};
	"window:close": {
		args: Record<string, never>;
		result: undefined;
	};
};

export type IpcEvents = {
	"agent:event": { sessionId: string; event: AgentEvent };
	"agent:sessionUpdated": { session: Session };
};
