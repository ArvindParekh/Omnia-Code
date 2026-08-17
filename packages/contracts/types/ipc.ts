import type { AllEvents, EventType } from "./events.js";
import type {
	MessageAttachment,
	Provider,
	ProviderModelCapabilities,
	QuoteRef,
} from "./provider.js";
import type { Session } from "./session.js";
import type { SessionView } from "./session-view.js";

export type IpcChannels = {
	"session.createRequested": {
		args: {
			provider: Provider;
			workspacePath: string;
			title: string;
		};
		result: Session;
	};
	"session.renameRequested": {
		args: {
			sessionId: string;
			customTitle: string;
		};
		result: undefined;
	};
	"session.deleteRequested": {
		args: {
			sessionId: string;
		};
		result: undefined;
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
			sessionId: string;
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
	"app:getSessionView": {
		args: {
			sessionId: string;
		};
		result: SessionView;
	};
	"app:detectProviderModels": {
		args: {
			provider: Provider;
		};
		result: ProviderModelCapabilities;
	};
	"app:detectProviders": {
		args: Record<string, never>;
		result: Provider[];
	};
	"app.detectProviderModels": {
		args: {
			provider: Provider;
		};
		result: ProviderModelCapabilities;
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
	"app:sessionDeleted": { sessionId: string };
};
