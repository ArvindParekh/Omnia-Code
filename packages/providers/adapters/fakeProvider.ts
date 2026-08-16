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
			const blockId = crypto.randomUUID();
			for (let i = 0; i < 5; i++) {
				await new Promise((r) => setTimeout(r, 1000));
				yield {
					type: "assistant.delta",
					blockId,
					text: `HDone. Here's a summary of everything:
  ──────
  ## Root cause: StrictMode double-invocation of state updaters

  The bug:  streamingMsgId.current = id  was a side effect inside a  setMessages  updater. React StrictMode calls updaters twice (discarding the first result). The sequence:

  1. 1st invocation —  streamingMsgId.current  is null → sets it to  "asmsg-111"  → returns  [...prev, newMsg]  (discarded)
  2. 2nd invocation —  streamingMsgId.current  is now  "asmsg-111"  (ref mutation persisted!) → falls into the  map  branch → no match → returns  prev  unchanged

  React keeps the 2nd result: no message ever gets added to state. Subsequent deltas also hit the  map  branch and find nothing. The message never surfaces in the chat.

  ## The fix (2 changes in use-messages.ts)

  1. Move the ref mutation outside the updater — set  streamingMsgId.current  before calling  setMessages , capture it as a local  const msgId , and use that local const inside the
  updater. The updater now detects "create vs append" by checking if the message exists in  prev  (a pure check), not by reading a ref.
  2. Added  detail: event.payload.text.slice(0, 80)  to the delta inspector event — this is why they were non-expandable (the  EventRow  component gates the caret icon and click handler
  on  event.detail  being truthy).ello, world!`,
				};
			}
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
