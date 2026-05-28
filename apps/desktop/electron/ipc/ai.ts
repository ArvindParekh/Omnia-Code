import { ipcMainHandle, ipcWebContentsSend } from "../util.js";
import { providerService } from "../providers/index.js";

ipcMainHandle<"agent:createSession">(
  "agent:createSession",
  async (event, { provider }) => {
    const session = await providerService.createSession(provider);
    return session;
  },
);

ipcMainHandle<"agent:sendMessage">(
  "agent:sendMessage",
  async (event, { sessionId, message }) => {
    for await (const chunk of providerService.sendMessage(sessionId, message)) {
      switch (chunk.type) {
        case "delta":
          ipcWebContentsSend<"agent:event">("agent:event", event.sender, {
            sessionId,
            event: chunk,
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

ipcMainHandle<"agent:getSessions">("agent:getSessions", () => {
  const sessions = providerService.getSessions();
  return sessions;
});

ipcMainHandle<"agent:getEvents">("agent:getEvents", (event, { sessionId }) => {
  const events = providerService.getEvents(sessionId);
  return events;
});

ipcMainHandle<"agent:detectProviders">("agent:detectProviders", () => {
  const providers = providerService.detectProviders();
  return providers;
});
