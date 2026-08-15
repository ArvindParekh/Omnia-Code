import type {
	SessionCreated,
	TurnStarted,
	UserMessageCreated,
	AssistantDeltaReceived,
	AssistantMessageCompleted,
	ToolCallStarted,
	ToolCallCompleted,
	ApprovalRequested,
	ApprovalResolved,
	TurnCompleted,
} from "../types/events";
import type { ToolRisk } from "../types/provider";

const now = Date.now();

export const sampleSessionEvents: (
	| SessionCreated
	| TurnStarted
	| UserMessageCreated
	| AssistantDeltaReceived
	| AssistantMessageCompleted
	| TurnCompleted
)[] = [
	{
		id: "evt-1",
		seq: 1,
		type: "session.created",
		payload: {
			sessionId: "session-1",
			provider: "fake",
			workspacePath: "/home/user/project",
			title: "Demo session",
			policy: { capabilities: [] },
			ref: { sessionId: "session-1", provider: "fake" },
			createdAt: now,
		},
		occurredAt: now,
	},
	{
		id: "evt-2",
		seq: 2,
		type: "turn.started",
		payload: {
			sessionId: "session-1",
			turnId: "turn-1",
			provider: "fake",
			startedAt: now + 10,
		},
		occurredAt: now + 10,
	},
	{
		id: "evt-3",
		seq: 3,
		type: "message.userCreated",
		payload: {
			sessionId: "session-1",
			turnId: "turn-1",
			messageId: "msg-1",
			text: "Please open src/index.ts and add a TODO comment",
			attachments: [],
		},
		occurredAt: now + 20,
	},
	{
		id: "evt-4",
		seq: 4,
		type: "message.assistantDeltaReceived",
		payload: {
			sessionId: "session-1",
			turnId: "turn-1",
			messageId: "msg-2",
			text: "I will read src/index.ts to find the right insertion point...",
		},
		occurredAt: now + 30,
	},
	{
		id: "evt-5",
		seq: 5,
		type: "message.assistantCompleted",
		payload: {
			sessionId: "session-1",
			turnId: "turn-1",
			messageId: "msg-2",
		},
		occurredAt: now + 40,
	},
	{
		id: "evt-6",
		seq: 6,
		type: "turn.completed",
		payload: {
			sessionId: "session-1",
			turnId: "turn-1",
			completedAt: now + 50,
		},
		occurredAt: now + 50,
	},
];

export const sampleApprovalFlowEvents: (
	| SessionCreated
	| TurnStarted
	| UserMessageCreated
	| AssistantDeltaReceived
	| ToolCallStarted
	| ApprovalRequested
	| ApprovalResolved
	| ToolCallCompleted
	| AssistantMessageCompleted
	| TurnCompleted
)[] = [
	{
		id: "evt-a1",
		seq: 1,
		type: "session.created",
		payload: {
			sessionId: "session-2",
			provider: "fake",
			workspacePath: "/home/user/project",
			title: "Approval demo",
			policy: { capabilities: [] },
			ref: { sessionId: "session-2", provider: "fake" },
			createdAt: now + 1000,
		},
		occurredAt: now + 1000,
	},
	{
		id: "evt-a2",
		seq: 2,
		type: "turn.started",
		payload: {
			sessionId: "session-2",
			turnId: "turn-2",
			provider: "fake",
			startedAt: now + 1010,
		},
		occurredAt: now + 1010,
	},
	{
		id: "evt-a3",
		seq: 3,
		type: "message.userCreated",
		payload: {
			sessionId: "session-2",
			turnId: "turn-2",
			messageId: "msg-10",
			text: "Please commit the change and push to origin/main",
			attachments: [],
		},
		occurredAt: now + 1020,
	},
	{
		id: "evt-a4",
		seq: 4,
		type: "tool.callStarted",
		payload: {
			sessionId: "session-2",
			turnId: "turn-2",
			toolCallId: "tool-1",
			toolName: "git",
			input: { cmd: "git commit -am 'add TODO'" },
			risk: "high" as ToolRisk,
		},
		occurredAt: now + 1030,
	},
	{
		id: "evt-a5",
		seq: 5,
		type: "approval.requested",
		payload: {
			approvalId: "apr-1",
			sessionId: "session-2",
			turnId: "turn-2",
			toolCallId: "tool-1",
			toolName: "git",
			input: { cmd: "git commit -am 'add TODO'" },
			risk: "high" as ToolRisk,
		},
		occurredAt: now + 1040,
	},
	{
		id: "evt-a6",
		seq: 6,
		type: "approval.resolved",
		payload: {
			approvalId: "apr-1",
			approved: true,
			note: "Looks safe",
		},
		occurredAt: now + 1050,
	},
	{
		id: "evt-a7",
		seq: 7,
		type: "tool.callCompleted",
		payload: {
			sessionId: "session-2",
			turnId: "turn-2",
			toolCallId: "tool-1",
			output: { status: "committed", sha: "deadbeef" },
			isError: false,
		},
		occurredAt: now + 1060,
	},
	{
		id: "evt-a8",
		seq: 8,
		type: "message.assistantCompleted",
		payload: {
			sessionId: "session-2",
			turnId: "turn-2",
			messageId: "msg-11",
		},
		occurredAt: now + 1070,
	},
	{
		id: "evt-a9",
		seq: 9,
		type: "turn.completed",
		payload: {
			sessionId: "session-2",
			turnId: "turn-2",
			completedAt: now + 1080,
		},
		occurredAt: now + 1080,
	},
];

export default { sampleSessionEvents, sampleApprovalFlowEvents };
