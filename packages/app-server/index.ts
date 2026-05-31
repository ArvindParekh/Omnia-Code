import { CommandRouter } from "./command-router";
import { createEvent, EventStore } from "./event-store";

const router = new CommandRouter();

router.use(async (envelope, next) => {
  console.log(`[${envelope.requestedAt}] dispatching ${envelope.type} (id=${envelope.id})`);
  await next();
}).use(async (envelope, next) => {
  if (envelope.requestedBy === "user") {
        // auth check, rate limiting, etc.
      }
      await next();
}).on("session.createRequested", async (envelope) => {
  // await sessionService.create({
  //   provider: envelope.payload.provider,
  //   workspacePath: envelope.payload.workspacePath,
  //   title: envelope.payload.title,
  // })
}).on("turn.startRequested", async (envelope) => {
    // await turnService.start(envelope.payload.sessionId, envelope.payload.text);
  })
  .on("turn.cancelRequested", async (envelope) => {
    // await turnService.cancel(envelope.payload.sessionId, envelope.payload.turnId);
  })
  .on("approval.resolveRequested", async (envelope) => {
    // await approvalService.resolve(envelope.payload.approvalId, envelope.payload.approved);
  });

// const eventStore = new EventStore();
// const ev = createEvent("session.created", {
//   sessionId: "123",
//   provider: "claude",
//   workspacePath: "/jaldjf",
//   title: "new sess",
//   createdAt: Date.now(),
// })
// eventStore.addEvent(ev);

export const appServer = {
  router,
  eventStore: new EventStore(),
};
