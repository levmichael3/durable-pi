# AGENTS.md

Durable Pi: a network of durable coding agents. Each **device** runs `dpi-backend` and owns its agents in SQLite; the web hub, `dpi-tui` and curl are thin clients that reach devices by URL + bearer token. Read `README.md` for the full picture and `apps/dpi-backend/API.md` for the wire contract. For orientation, follow `.claude/commands/prime.md`.

## Commands run through `just`

All developer work goes through `just` from the repo root; recipes live in `just/<group>/mod.just` (net, backend, hub, tui, test, proactive). Recipes run in `zsh`, and most `set working-directory` to their app, so you don't `cd` yourself. There is no root `package.json` or monorepo tool — each app under `apps/` has its own npm scripts (`tsc --noEmit` for `check`, `tsx --test tests/*.test.ts` for `test`).

- Node **24** is required (`node:sqlite`); the repo pins `@earendil-works/pi-durable` **1.0.3**.
- `just install` — `npm install` for the four network apps (`dpi-sdk`, `dpi-backend`, `dpi-playground`, `dpi-tui`). `dpi-playground` and `proactive-dpi-demo` are internal npm workspaces (`apps/*`).

## Verify before you finish

- `just check` (= `just test unit`) — type checks + unit tests for every app, faux model, no network, under a minute. This is the primary gate.
- `just test ui` — 28-check web UI suite against two faux devices (builds the FE first). Free.
- `just test device <id>` and `just test e2e <id>` — **cost money** (real model) and need the hub running plus installed Google Chrome. `e2e` also drives the TUI in tmux and needs a device that runs as a service.
- `just hub check` — build + `oxlint` + hub test for the playground only. `oxfmt` is the formatter (`npm run fmt` in `apps/dpi-playground`).

## Architecture facts that aren't obvious from filenames

- **`dpi-sdk` is not published.** Apps import it by relative path (`../../dpi-sdk/src/client.ts`) or via the `@sdk/*` alias in the Vite FE. `src/` has zero runtime deps and runs in browsers; only `src/node/` needs Node (`yaml`, `node:sqlite`, child processes).
- **One wire contract.** `apps/dpi-sdk/src/api.ts` is the v1 contract; `apps/dpi-backend` `npm run check` includes a pi-durable ↔ SDK wire-contract check. Change the API in both places.
- **One reducer, two renderers.** Web and TUI both feed `AgentModel`/`toTranscript` from `dpi-sdk`. Don't fork the transcript logic.
- **`dpi-backend` has no build step** — it runs via `tsx`. The hub serves a **built** FE: run `just hub build` once and again after any FE change, before `just hub start`.
- Ports: backend `4780`, hub `4781`, proactive demo `4790`. `just backend run` and `just hub start` free their port first (`just/free-port.sh`).

## Devices, tokens, secrets

- `dpi-network.yaml` is **gitignored** (template: `dpi-network.example.yaml`) and is the only place that names machines. Every `just net <verb> <id>` takes an id from it; nothing in code names a machine. `just net ids` lists them.
- `just net destroy <id>` is exe-dev only, refuses VMs not named in the YAML, and confirms first. Never touch a VM that isn't listed there.
- Tokens live in `~/.dpi/backend.env` per device and the hub registry `~/.dpi/network.sqlite` — never in the YAML or the repo. `just net up <id>` is idempotent; `just net rotate <id>` issues a new token.
- `OPENROUTER_API_KEY` lives in the repo-root `.env` (gitignored) and is copied by name into each device's `backend.env` (`env_keys`). Never print or echo key values; only confirm they are set. `DPI_PROVIDER=faux` runs without any key.

## Behavior you must preserve

- Closing a client never stops an agent, and a backend restart resumes unfinished tasks from their checkpoints. Replay-safe tools may rerun; unsafe ones return an interrupted result.
- A token holder has that device's shell and filesystem. `start_dirs` only set where sessions begin — they are **not** a sandbox.
- `jev-damage-control` and `system-prompts` extensions are off by default; the proactive demo has no login and its agents run `bash`.

## Existing instruction sources (don't duplicate)

- `.claude/commands/install.md` — full setup/verification flow (never starts servers, never touches non-`local` devices).
- `.claude/skills/agent-sandboxes-exe-dev/cookbook/dpi-network.md` — per-kind device debugging.
- `ai_docs/durable_pi/` and `ai_docs/pi/` — pi-durable and pi documentation snapshots.
