import type { AllEvents, EventType } from "./events.js";
import type { Provider } from "./provider.js";
import type { Session } from "./session.js";

export type IpcChannels = {
	"session.createRequested": {
		args: {
			provider: Provider;
		};
		result: Session;
	};
	"turn.startRequested": {
		args: {
			sessionId: string;
			text: string;
		};
		result: undefined;
	};
	"approval.resolveRequested": {
		args: {
			approvalId: string;
			approved: boolean;
		};
		result: undefined;
	};
	"app:getSessions": {
		args: Record<string, never>;
		result: Session[];
	};
	"app:getEvents": {
		args: {
			sessionId: string;
		};
		result: AllEvents<EventType>[];
	};
	"app:detectProviders": {
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
	"app:event": { sessionId: string; event: AllEvents<EventType> };
	"app:sessionUpdated": { session: Session };
};
