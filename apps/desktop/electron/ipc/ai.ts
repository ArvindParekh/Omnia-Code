import { ipcMainHandle, ipcWebContentsSend } from "../util.js";
import { appServer } from "@omnia/app-server";
import { BrowserWindow } from "electron";
import crypto from "node:crypto";

ipcMainHandle<"agent:createSession">("agent:createSession", async (event, { provider }) => {
	const commandId = crypto.randomUUID();
	await appServer.router.dispatch({
		id: commandId,
		type: "session.createRequested",
		payload: {
			provider,
			workspacePath: process.cwd(),
			title: `Session ${new Date().toLocaleTimeString()}`,
		},
		requestedAt: Date.now(),
		requestedBy: "user",
	});

	const session = appServer.sessionProjector.state.get(commandId);
	if (!session) throw new Error("Session creation failed to project.");
	return session;
});

ipcMainHandle<"agent:sendMessage">("agent:sendMessage", async (event, { sessionId, message }) => {
	const commandId = crypto.randomUUID();
	await appServer.router.dispatch({
		id: commandId,
		type: "turn.startRequested",
		payload: {
			sessionId,
			text: message,
			attachments: [],
		},
		requestedAt: Date.now(),
		requestedBy: "user",
	});
	return undefined;
});

ipcMainHandle<"agent:confirm">("agent:confirm", async (event, { sessionId, toolCallId, approved }) => {
	const commandId = crypto.randomUUID();
	await appServer.router.dispatch({
		id: commandId,
		type: "approval.resolveRequested",
		payload: {
			approvalId: toolCallId, // The old UI passed toolCallId as approvalId
			approved,
			note: "",
		},
		requestedAt: Date.now(),
		requestedBy: "user",
	});
	return undefined;
});

ipcMainHandle<"agent:getSessions">("agent:getSessions", () => {
	return Array.from(appServer.sessionProjector.state.values());
});

ipcMainHandle<"agent:getEvents">("agent:getEvents", (event, { sessionId }) => {
	const events = appServer.eventStore.getEvents();
	return events.filter(e => {
		return "sessionId" in e.payload && (e.payload as any).sessionId === sessionId;
	});
});

ipcMainHandle<"agent:detectProviders">("agent:detectProviders", async () => {
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

		ipcWebContentsSend<"agent:event">("agent:event", win.webContents, {
			sessionId,
			event: domainEvent,
		});

		// Emulate the old "agent:sessionUpdated" behavior for the renderer's session list
		if (domainEvent.type.startsWith("session.")) {
			const session = appServer.sessionProjector.state.get(sessionId);
			if (session) {
				ipcWebContentsSend<"agent:sessionUpdated">("agent:sessionUpdated", win.webContents, {
					session
				});
			}
		}
	}
});
