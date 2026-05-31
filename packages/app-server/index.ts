import { CommandRouter } from "./command-router";
import { createEvent, EventStore } from "./event-store";

const router = new CommandRouter();
const eventStore = new EventStore();

router.use(async (envelope, next) => {
  console.log(`[${envelope.requestedAt}] dispatching ${envelope.type} (id=${envelope.id})`);
  await next();
}).use(async (envelope, next) => {
  if (envelope.requestedBy === "user") {
        // auth check, rate limiting, etc.
      }
      await next();
}).on("session.createRequested", async (envelope) => {
  const ev = createEvent("session.created", {
    sessionId: envelope.id,
    provider: envelope.payload.provider,
    workspacePath: envelope.payload.workspacePath,
    title: envelope.payload.title ?? "",
    createdAt: Date.now(),
  })
  eventStore.addEvent(ev);
  // await sessionService.create({
  //   provider: envelope.payload.provider,
  //   workspacePath: envelope.payload.workspacePath,
  //   title: envelope.payload.title,
  // })
}).on("turn.startRequested", async (envelope) => {
  const ev = createEvent("turn.started", {
    sessionId: envelope.payload.sessionId,
    provider: "claude",
    startedAt: Date.now(),
    turnId: envelope.id,
  })
  eventStore.addEvent(ev);
    // await turnService.start(envelope.payload.sessionId, envelope.payload.text);
  })
  .on("turn.cancelRequested", async (envelope) => {
    const ev = createEvent("turn.canceled", {
      sessionId: envelope.payload.sessionId,
      turnId: envelope.id,
      canceledAt: Date.now(),
    })
    eventStore.addEvent(ev);
    // await turnService.cancel(envelope.payload.sessionId, envelope.payload.turnId);
  })
  .on("approval.resolveRequested", async (envelope) => {
    const ev = createEvent("approval.resolved", {
      approvalId: envelope.payload.approvalId,
      approved: envelope.payload.approved,
      note: envelope.payload.note,
    })
    eventStore.addEvent(ev);
    // await approvalService.resolve(envelope.payload.approvalId, envelope.payload.approved);
  });

export const appServer = {
  router,
  eventStore: new EventStore(),
};
