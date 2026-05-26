import { ipcMain } from "electron/main";
import { ipcMainHandle, ipcWebContentsSend } from "../util.js";

ipcMainHandle<"agent:createSession">("agent:createSession", ({ provider }) => {
  const session = providerService.createSession();
  return session;
});

ipcMainHandle<"agent:sendMessage">(
  "agent:sendMessage",
  async (event, { sessionId, message }) => {
    for (await chunk of providerService.sendMessage(sessionId, message)) {
      switch (chunk.type) {
        case 'text':
          ipcWebContentsSend<"agent:event">("agent:event", event.sender, { sessionId, event: chunk.text });
      }
    };
  },
);

ipcMainHandle<"agent:confirm">(
  "agent:confirm",
  ({ sessionId, toolCallId, approved }) => {
    providerService.confirm(sessionId, toolCallId, approved);
  },
);

ipcMainHandle<"agent:getSessions">("agent:getSessions", ({}) => {
  const sessions = providerService.getSessions();
  return sessions;
});

ipcMainHandle<"agent:getEvents">("agent:getEvents", ({ sessionId }) => {
  const events = providerService.getEvents(sessionId);
  return events;
});

ipcMainHandle<"agent:detectProviders">("agent:detectProviders", ({}) => {
  const providers = providerService.detectProviders();
  return providers;
});
