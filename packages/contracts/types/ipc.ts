import type { AllEvents, EventType } from "./events.js";
import type { Provider } from "./provider.js";
import type { Session } from "./session.js";

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
		result: AllEvents<EventType>[];
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
	"agent:event": { sessionId: string; event: AllEvents<EventType> };
	"agent:sessionUpdated": { session: Session };
};
