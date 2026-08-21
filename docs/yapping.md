something i should've done a while ago. this is a yapping document that consists of everything i want to pin down while coding this project. can potentially include why certain decisions were made, what problems arised, solutions thought of and discussed, and approaches selected.

---

### Causation Id

Causation id on an event points to what event (decision by the agent) caused this particular event to occur. It needs to look at all the previous events and figure out the correct cause for this event.

Essentially the problem is: on receiving an event, to set it's causationId, we have to correctly identity the event that did cause it, and that event exists in all the events that've come before it.

One rudimentary approach is: on every event, make it pass through a switch case, that'd query all the previous events and find the last possible event that matches a "possible causes" array of events for that particular event and get it's id.

however, this is O(n) on every single incoming event.

another approach is to maintain a preceding mutable pointer. it walks forward through the turn's events as they are appended. it has two possible rules:

- move forward one step: on content events like assistant.deltaReceived, reasoning deltas, text blocks, etc
- or read it's value: on structural events like tool.callStarted, approval.resolveRequested, etc.

this is much better and is just reading or updating - all O(1). love it!

correlationId should always point to what is this event correlating with, and it's always the turnId. turn is defined as the user message + assistant response. the codebase incorrect had this as (command) envelope.id, which makes no sense. fixing this.

also incorrectly identified the cause of a usermessage to be turn.started. but that's incorrect. a usermessage comes after a turn is started. user message causes the entire assistant response block to occur. but it consists of a bunch of assistantDeltas. so we store a map of messageId -> eventId (userMessage event). so every incoming delta reads the userMessage's event id from it's messageId and sets that as the causationId. problem solved.
