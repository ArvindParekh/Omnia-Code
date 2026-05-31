// a fake provider adapter for testing

import type { ProviderRuntimeEvent } from "@omnia/contracts";
import type {
	ProviderAdapter,
	CreateProviderSessionInput,
	ResumeProviderSessionInput,
	SendProviderTurnInput,
	CancelProviderTurnInput,
	ResolveProviderApprovalInput,
	DisposeProviderSessionInput,
} from "../types.js";

export const fakeProviderAdapter: ProviderAdapter = {
	provider: "fake",

	detect: async () => ({
		provider: "fake",
		status: "available",
		label: "Fake Provider",
		detail: "Fake provider is available for testing",
		detectedVersion: "1.0.0",
	}),

	createSession: async (input: CreateProviderSessionInput) => {
		return {
			sessionId: input.sessionId,
			provider: "fake",
			externalId: undefined,
			stateJson: undefined,
		};
	},

	resumeSession: async (_input: ResumeProviderSessionInput) => {
		return;
	},

	sendTurn: (_input: SendProviderTurnInput) => {
		return (async function* (): AsyncIterable<ProviderRuntimeEvent> {
			yield { type: "assistant.delta", text: "Hello, world!" };
		})();
	},

	cancelTurn: async (_input: CancelProviderTurnInput) => {
		return;
	},

	resolveApproval: async (_input: ResolveProviderApprovalInput) => {
		return;
	},

	disposeSession: async (_input: DisposeProviderSessionInput) => {
		return;
	},
};
