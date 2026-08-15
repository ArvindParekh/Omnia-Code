import type { AllEvents, EventType } from "./events.js";
import type { MessageAttachment, Provider, QuoteRef } from "./provider.js";
import type { Session } from "./session.js";

export type IpcChannels = {
	"session.createRequested": {
		args: {
			provider: Provider;
			workspacePath: string;
			title: string;
		};
		result: Session;
	};
	"turn.startRequested": {
		args: {
			sessionId: string;
			text: string;
			attachments?: MessageAttachment[];
			quote?: QuoteRef;
		};
		result: string;
	};
	"turn.cancelRequested": {
		args: {
			sessionId: string;
			turnId: string;
		};
		result: undefined;
	};
	"approval.resolveRequested": {
		args: {
			approvalId: string;
			approved: boolean;
			note?: string;
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
	"app.getSessionView": {
		args: Record<string, never>;
		result: 
	},
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
