import type { Session } from "@omnia/contracts";
import { ipcMainHandle, ipcWebContentsSend } from "../util.js";
import { appServer } from "../app-server.js";
import { BrowserWindow } from "electron";
import crypto from "node:crypto";
import { resolveWorkspacePath } from "../workspacePath.js";
import { rememberWorkspace } from "./electron-store.js";

ipcMainHandle<"session.createRequested">(
	"session.createRequested",
	async (event, { provider, workspacePath, title }) => {
		const commandId = crypto.randomUUID();
		const resolvedWorkspacePath = resolveWorkspacePath(workspacePath);
		await appServer.router.dispatch({
			id: commandId,
			type: "session.createRequested",
			payload: {
				provider,
				workspacePath: resolvedWorkspacePath,
				title,
			},
			requestedAt: Date.now(),
			requestedBy: "user",
		});

		rememberWorkspace(resolvedWorkspacePath);

		const session = appServer.sessionProjector.state.get(commandId);
		if (!session) throw new Error("Session creation failed to project.");
		return session;
	},
);

ipcMainHandle<"session.renameRequested">(
	"session.renameRequested",
	async (event, { sessionId, customTitle }) => {
		const commandId = crypto.randomUUID();
		await appServer.router.dispatch({
			id: commandId,
			requestedAt: Date.now(),
			requestedBy: "user",
			type: "session.renameRequested",
			payload: {
				sessionId,
				customTitle,
			},
		});
		return undefined;
	},
);

ipcMainHandle<"session.deleteRequested">(
	"session.deleteRequested",
	async (event, { sessionId }) => {
		const commandId = crypto.randomUUID();
		await appServer.router.dispatch({
			id: commandId,
			requestedAt: Date.now(),
			requestedBy: "user",
			type: "session.deleteRequested",
			payload: {
				sessionId,
			},
		});
		return undefined;
	},
);

ipcMainHandle<"turn.startRequested">(
	"turn.startRequested",
	async (event, { sessionId, text, attachments, quote, model, effort }) => {
		const commandId = crypto.randomUUID();
		const turnId = crypto.randomUUID();
		await appServer.router.dispatch({
			id: commandId,
			type: "turn.startRequested",
			payload: {
				sessionId,
				text,
				attachments: attachments ?? [],
				quote,
				model,
				effort,
				turnId,
			},
			requestedAt: Date.now(),
			requestedBy: "user",
		});
		return turnId;
	},
);

ipcMainHandle<"turn.cancelRequested">(
	"turn.cancelRequested",
	async (event, { sessionId, turnId }) => {
		const commandId = crypto.randomUUID();
		await appServer.router.dispatch({
			id: commandId,
			type: "turn.cancelRequested",
			payload: {
				sessionId,
				turnId,
			},
			requestedBy: "user",
			requestedAt: Date.now(),
		});
		return undefined;
	},
);

ipcMainHandle<"approval.resolveRequested">(
	"approval.resolveRequested",
	async (event, { sessionId, approvalId, approved, note }) => {
		const commandId = crypto.randomUUID();
		await appServer.router.dispatch({
			id: commandId,
			type: "approval.resolveRequested",
			payload: {
				sessionId,
				approvalId,
				approved,
				note: note ?? "",
			},
			requestedAt: Date.now(),
			requestedBy: "user",
		});
		return undefined;
	},
);

ipcMainHandle<"app:getSessions">("app:getSessions", () => {
	return Array.from(appServer.sessionProjector.state.values());
});

ipcMainHandle<"app:getSessionView">("app:getSessionView", async (event, { sessionId }) => {
	return (
		appServer.sessionViewProjector.state.get(sessionId) ?? {
			sessionId,
			items: [],
			lastSeq: 0,
		}
	);
});

ipcMainHandle<"app:getCostSummary">("app:getCostSummary", (event, { sessionId }) => {
	return (
		appServer.costProjector.state.get(sessionId) ?? {
			sessionId,
			totalCostUsd: 0,
			usage: {
				input_tokens: 0,
				output_tokens: 0,
				cache_read_input_tokens: 0,
				cache_creation_input_tokens: 0,
			},
			perModel: {},
			perTurn: {},
		}
	);
});

ipcMainHandle<"app:getEvents">("app:getEvents", (event, { sessionId }) => {
	return appServer.eventStore.getEvents(sessionId);
});

ipcMainHandle<"app:detectProviderModels">(
	"app:detectProviderModels",
	async (event, { provider }) => {
		return appServer.registry.get(provider).listModels();
	},
);

ipcMainHandle<"app:detectProviders">("app:detectProviders", async () => {
	const available = await appServer.registry.detectAvailable();
	return available.map((a) => a.provider);
});

ipcMainHandle<"app.detectProviderModels">(
	"app.detectProviderModels",
	async (event, { provider }) => {
		return appServer.registry.get(provider).listModels();
	},
);

const lastBroadcastSession = new Map<string, Session>();

// Broadcast domain events to the renderer
appServer.eventStore.subscribe((domainEvent) => {
	const sessionId =
		"sessionId" in domainEvent.payload ? (domainEvent.payload as any).sessionId : "";

	const deleted = domainEvent.type === "session.deleted";
	if (deleted) lastBroadcastSession.delete(sessionId);

	const session = deleted ? undefined : appServer.sessionProjector.state.get(sessionId);
	const changed = session !== undefined && session !== lastBroadcastSession.get(sessionId);
	if (session && changed) lastBroadcastSession.set(sessionId, session);

	for (const win of BrowserWindow.getAllWindows()) {
		ipcWebContentsSend<"app:event">("app:event", win.webContents, {
			sessionId,
			event: domainEvent,
		});

		if (deleted) {
			ipcWebContentsSend<"app:sessionDeleted">("app:sessionDeleted", win.webContents, {
				sessionId,
			});
			continue;
		}

		if (session && changed) {
			ipcWebContentsSend<"app:sessionUpdated">("app:sessionUpdated", win.webContents, {
				session,
			});
		}
	}
});
