import { ipcMainHandle, ipcWebContentsSend } from "../util.js";
import { appServer } from "@omnia/app-server";
import { BrowserWindow } from "electron";
import crypto from "node:crypto";
import { resolveWorkspacePath } from "../workspacePath.js";

ipcMainHandle<"session.createRequested">("session.createRequested", async (event, { provider, workspacePath, title }) => {
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
});

ipcMainHandle<"turn.startRequested">("turn.startRequested", async (event, { sessionId, text }) => {
	const commandId = crypto.randomUUID();
  const turnId = crypto.randomUUID();
	await appServer.router.dispatch({
		id: commandId,
		type: "turn.startRequested",
		payload: {
			sessionId,
			text,
			attachments: [],
			turnId,
		},
		requestedAt: Date.now(),
		requestedBy: "user",
	});
	return turnId;
});

ipcMainHandle<"turn.cancelRequested">("turn.cancelRequested", async (event, { sessionId, turnId }) => {
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
  })
  return undefined;
})

ipcMainHandle<"approval.resolveRequested">("approval.resolveRequested", async (event, { approvalId, approved }) => {
	const commandId = crypto.randomUUID();
	await appServer.router.dispatch({
		id: commandId,
		type: "approval.resolveRequested",
		payload: {
			approvalId,
			approved,
			note: "",
		},
		requestedAt: Date.now(),
		requestedBy: "user",
	});
	return undefined;
});

ipcMainHandle<"app:getSessions">("app:getSessions", () => {
	return Array.from(appServer.sessionProjector.state.values());
});

ipcMainHandle<"app:getEvents">("app:getEvents", (event, { sessionId }) => {
	const events = appServer.eventStore.getEvents();
	return events.filter(e => {
		return "sessionId" in e.payload && (e.payload as any).sessionId === sessionId;
	});
});

ipcMainHandle<"app:detectProviders">("app:detectProviders", async () => {
	const available = await appServer.registry.detectAvailable();
	return available.map(a => a.provider);
});

// Broadcast domain events to the renderer
appServer.eventStore.subscribe((domainEvent) => {
	const windows = BrowserWindow.getAllWindows();
	for (const win of windows) {
		const sessionId = "sessionId" in domainEvent.payload
			? (domainEvent.payload as any).sessionId
			: "";

		ipcWebContentsSend<"app:event">("app:event", win.webContents, {
			sessionId,
			event: domainEvent,
		});

		// Emulate the old "agent:sessionUpdated" behavior for the renderer's session list
		if (domainEvent.type.startsWith("session.")) {
			const session = appServer.sessionProjector.state.get(sessionId);
			if (session) {
				ipcWebContentsSend<"app:sessionUpdated">("app:sessionUpdated", win.webContents, {
					session
				});
			}
		}
	}
});
