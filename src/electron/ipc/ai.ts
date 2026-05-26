import { ipcMainHandle, ipcWebContentsSend } from "../util.js";
import { providerService } from "../providers/index.js";

ipcMainHandle<"agent:createSession">(
  "agent:createSession",
  (event, { provider }) => {
    const session = providerService.createSession(provider);
    return session;
  },
);

ipcMainHandle<"agent:sendMessage">(
  "agent:sendMessage",
  async (event, { sessionId, message }) => {
    for await (const chunk of providerService.sendMessage(sessionId, message)) {
      switch (chunk.type) {
        case "text":
          ipcWebContentsSend<"agent:event">("agent:event", event.sender, {
            sessionId,
            event: chunk.text,
          });
      }
    }
  },
);

ipcMainHandle<"agent:confirm">(
  "agent:confirm",
  (event, { sessionId, toolCallId, approved }) => {
    providerService.confirm(sessionId, toolCallId, approved);
  },
);

ipcMainHandle<"agent:getSessions">("agent:getSessions", (event, {}) => {
  const sessions = providerService.getSessions();
  return sessions;
});

ipcMainHandle<"agent:getEvents">("agent:getEvents", (event, { sessionId }) => {
  const events = providerService.getEvents(sessionId);
  return events;
});

ipcMainHandle<"agent:detectProviders">("agent:detectProviders", (event, {}) => {
  const providers = providerService.detectProviders();
  return providers;
});
