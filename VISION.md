# Omnia Code — Vision

## The Thesis

Every serious developer already owns multiple AI coding agents. Claude Code. Gemini CLI. OpenCode. Codex. They've paid for subscriptions, authenticated, configured them. The investment is already made.

But those agents live in terminal windows. Their reasoning is invisible. Switching between them means juggling shells. A "confirmation" is a raw CLI prompt. Sessions disappear when the terminal closes.

**Omnia Code is the desktop layer those agents should have shipped with.**

No new subscription. No new API key. Your existing agents, elevated.

---

## The Problem Worth Solving

The core friction isn't that AI coding agents are bad at coding. It's that they're opaque and disconnected.

When an agent calls a tool, you see a line of text. When it makes a decision, you infer it from output. When you want to approve or reject an action, you type into a blinking cursor. When the session ends, it's gone.

This opacity erodes trust. And low trust means shallow usage — developers interrupt agents early, avoid risky delegations, and hover anxiously over terminals. The agents are capable. The interface is the bottleneck.

The second friction: fragmentation. Claude has strengths. Gemini has others. OpenCode has its own model. Developers have favorites for different contexts, but switching means re-establishing a whole environment.

---

## What Omnia Is

A desktop application (macOS, Windows, Linux) that wraps the AI agent CLIs you already have installed and gives them a proper GUI.

**At its core:**
- **One window** for all your agents. Switch providers per session. No terminal juggling.
- **Transparent reasoning** rendered as an inspectable tree — every tool call, every result, every agent decision is visible and navigable.
- **Proper confirmation UI** — when an agent wants to run a command or write a file, you get a real interface to approve or reject, not a terminal prompt.
- **Session persistence** — conversations survive restarts. Pick up where you left off.
- **Streaming-first** — text renders as it arrives, tool calls expand in real time, the UI reflects the agent's live state.

**What it is not:**
- A new AI service. No API keys, no new subscriptions.
- A wrapper that hides the agent. The opposite — it exposes more.
- A competitor to Claude Code or Gemini CLI. It makes them better.

---

## Who It's For

Developers who are already power users of AI coding agents and have hit the ceiling of what a terminal gives them.

They don't need to be convinced that AI agents are useful — they're already users. They feel the friction of opacity, the annoyance of session loss, the awkwardness of confirmation prompts. They want the agent to feel like a collaborator, not a black box they're supervising from a shell.

---

## The End State

A developer opens Omnia. They have three providers available because they have all three installed. They start a session, pick Claude for this task. The session view shows a tree: their message, then under it — a tool call to read a file, a tool call to edit it, a confirmation request they approve with a click, a text response. They switch to a new session with Gemini for a different task. Both sessions persist. Both are inspectable. Later, they search session history for a conversation from last week.

The terminal is still there if they want it. But they don't need it.

---

## Why It Works (The Psychology)

**You already own this.** The endowment effect is real — developers who've invested in Claude Code or Gemini CLI subscriptions feel that investment. Omnia makes it worth more without asking for more.

**Visibility creates trust.** When you can see exactly what an agent did and why — every tool call, every decision — you extend trust further. Trust enables deeper delegation. Deeper delegation is where the real productivity lives.

**One job, one place.** Context switching between terminal windows is a hidden tax on focus. One surface for all agents eliminates it.

---

## What Success Looks Like

A developer who was managing two AI agent sessions in separate terminals — interrupting constantly because they couldn't see what was happening — now runs four sessions in Omnia, approves tool calls with a click, and trusts the agents to go further because the whole process is transparent.

They didn't pay for anything new. They just stopped wasting what they already had.
