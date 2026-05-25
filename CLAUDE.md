# CLAUDE.md

## Task Completion Requirements

- All of `bun fmt`, `bun lint`, and `bun typecheck` must pass before considering tasks completed.
- NEVER run `bun test`. Always use `bun run test` (runs Vitest).

## Project Snapshot

Omnia Code is a desktop app (Electron + React + TypeScript) that wraps AI agent CLIs — Claude Code, Gemini CLI, OpenCode, Codex — in a rich GUI, reusing the user's existing installed binaries and subscriptions with no new API keys required. The core value is transparency: every tool call, agent decision, and confirmation is rendered as an inspectable tree, not hidden behind terminal output.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## Reference Repos

- Open-source Codex repo: https://github.com/openai/codex
- Codex-Monitor (Tauri, feature-complete, strong reference implementation): https://github.com/Dimillian/CodexMonitor
- t3code repo: https://github.com/pingdotgg/t3code
- executor repo: https://github.com/RhysSullivan/executor

Use these as implementation references when designing protocol handling, UX flows, and operational safeguards.
