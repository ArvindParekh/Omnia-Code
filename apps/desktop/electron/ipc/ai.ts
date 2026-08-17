import { ipcMainHandle, ipcWebContentsSend } from "../util.js";
import { appServer } from "../app-server.js";
import { BrowserWindow } from "electron";
import crypto from "node:crypto";
import { resolveWorkspacePath } from "../workspacePath.js";

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
	async (event, { sessionId, text, attachments, quote }) => {
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

// Broadcast domain events to the renderer
appServer.eventStore.subscribe((domainEvent) => {
	const windows = BrowserWindow.getAllWindows();
	for (const win of windows) {
		const sessionId =
			"sessionId" in domainEvent.payload ? (domainEvent.payload as any).sessionId : "";

		ipcWebContentsSend<"app:event">("app:event", win.webContents, {
			sessionId,
			event: domainEvent,
		});

		if (domainEvent.type === "session.deleted") {
			ipcWebContentsSend<"app:sessionDeleted">("app:sessionDeleted", win.webContents, {
				sessionId,
			});
			continue;
		}

		// Emulate the old "agent:sessionUpdated" behavior for the renderer's session list
		if (domainEvent.type.startsWith("session.")) {
			const session = appServer.sessionProjector.state.get(sessionId);
			if (session) {
				ipcWebContentsSend<"app:sessionUpdated">("app:sessionUpdated", win.webContents, {
					session,
				});
			}
		}
	}
});
