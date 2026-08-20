# Omnia Code

One window for all your AI coding agents — transparent tool calls, persistent sessions, and safe approvals. No new subscriptions or API keys required.

<img width="1655" height="1065" alt="image" src="https://github.com/user-attachments/assets/9de49a24-d7a3-4dd9-90c8-279e364c9836" />

---

## What is Omnia Code?

Omnia Code is a desktop application (Electron + Vite + React + TypeScript + TailwindCSS + shadcn) that wraps the AI agent CLIs you already own — Claude Code, Gemini CLI, OpenCode, Codex — and gives them a proper, inspectable GUI.

Why this matters:
- Visibility: every tool call, file read/write, and agent decision is shown as an inspectable tree so you can trust what runs.
- Persistence: sessions survive restarts so conversations and context aren't lost.
- Control: actions that modify files surface real UI confirmations — approve or reject with a click.
- No new accounts: uses your installed agents and existing subscriptions.

---

## Quickstart

1. Clone the repository
2. Copy `.env.example` → `.env` and adjust if needed
3. Install dependencies:

```bash
npm install
```

4. Start the app (development):

```bash
npm run dev
```

This starts the renderer and a local dev server (default port 3524). Change the port in `.env` if needed.

Build for production:

- Windows: `npm run dist:win`
- Linux: `npm run dist:linux`
- macOS: `npm run dist:mac`

---

## Download

Pre-built releases are on the [Releases page](https://github.com/ArvindParekh/Omnia-Code/releases). Builds are unsigned, so:

- **macOS**: right-click the app → "Open" the first time to get past Gatekeeper.
- **Windows**: click "More info" → "Run anyway" on the SmartScreen prompt.
- **Linux**: prefer the **`.deb`** — it configures the sandbox correctly on install. The **`.AppImage`** only gets a working sandbox when launched via desktop integration (double-click in a file manager, or after "Integrate and run" in AppImageLauncher); running it directly from a terminal or via AppImageLauncher's binfmt shortcut will crash with a sandbox error unless you add the flag yourself: `./Omnia\ Code.AppImage --no-sandbox`. This is a known Chromium/AppImage limitation on modern distros (AppArmor restricts the unprivileged sandbox fallback), not specific to this app.

---

## Core features

- Single window for multiple agents — pick any installed provider per session.
- Live, streaming rendering of agent output and tool calls.
- Inspectable decision trees: expand a message to see the exact sequence of tool calls, results, and reasoning.
- Safe confirmations: file edits and shell commands require explicit approval by default.
- Session persistence and searchable history.
- IPC type-safety and secure defaults for Electron.

---

## Product vision (short)

Developers already subscribe to AI agents. The problem isn't models — it's the interface. Omnia Code turns supervision into confident collaboration by making the agent's reasoning visible, auditable, and persistent.

Psychology-driven design highlights:
- Leverages the endowment effect — users keep value from their existing subscriptions.
- Builds trust through visibility (availability heuristic + authority).
- Lowers activation energy with auto-detection and a demo-first onboarding flow.

---

## Onboarding notes (for contributors)

- Auto-detect installed CLIs on first run and show a 1-click "sample session" that demonstrates a read → propose → approval → write flow.
- Default to "require approval" for any file or shell change; allow opt-in automation later.
- Telemetry: none by default. Any telemetry must be opt-in and documented.

---

## Contributing

Contributions are welcome. Keep changes small and focused:

1. Fork → branch
2. Run the app locally and verify dev flow: `npm run dev`
3. Open a PR with a clear description and screenshots for UI work

See docs/ for architecture notes and the project VISION.md for strategy.

---

## License

MIT
