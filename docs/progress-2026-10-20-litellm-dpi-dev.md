# Progress — LiteLLM wiring + `dpi-dev` deploy

Date: 2026-10-20 (UTC). Branch: `litellm-wiring` (pushed to origin).

## Commits on this branch

- `d8aa5d1` — docs: add AGENTS.md with repo guidance for agents
- `09aa42b` — feat(backend): wire a LiteLLM provider in place of OpenRouter

Working tree after those commits holds only the pre-existing stray
`package.json` / `package-lock.json` at the repo root (unrelated user
plugin clutter, left untracked on purpose). No other modifications.

## Objective

Run durable-pi agent inference through a LiteLLM proxy instead of
OpenRouter. Jev stays on TypeSafe. Secrets live in the macOS Keychain,
never in the repo.

## Decisions

- Device `dpi-dev` is an exe-dev VM, public host `https://dpi-dev.exe.xyz`.
- Backend provider `DPI_PROVIDER=litellm`; model `open-weight-smart`
  (provider id `litellm`, ~1M context, reasoning on).
- LiteLLM base URL defaults to the team proxy; overridable with
  `LITELLM_URL`. Key is read from `LITELLM_API_KEY` at request time.
- `dpi-network.yaml` (gitignored) declares `env_keys:
  [LITELLM_API_KEY, TYPESAFE_API_KEY]` and `env: {DPI_PROVIDER:
  litellm}`. No secret values in YAML, code, or git.
- `apps/dpi-backend/src/jev.ts` is TypeSafe-only (`TYPESAFE_API_KEY`).
- Node 24 is required for backend/SDK work (`node:sqlite`).
  Run `just` with Node 24 on PATH when a recipe touches the SDK.

## 1. How secrets are loaded (values never touch the repo)

Chain, in order:

1. **Keychain → shell.** The operator retrieves each key from the macOS
   Keychain and exports it into the deploy shell (`LITELLM_API_KEY`,
   `TYPESAFE_API_KEY`). The repo-root `.env` is gitignored and holds
   only comments and retrieval notes — no values.
2. **`just net up <id>` → device `backend.env`.** The SDK driver
   (`apps/dpi-sdk/src/node/drivers.ts`, `writeEnv`) builds the env file
   from names only: for each name in `env_keys` it takes the value from
   the repo `.env` if present, else from `process.env` (this is the
   fallback the Keychain exports satisfy). It writes
   `<home>/backend.env` on the device with mode 600, keeping the
   existing `DPI_TOKEN` unless rotating. Plain `env:` entries
   (e.g. `DPI_PROVIDER`) are written as-is.
3. **Backend boot.** `apps/dpi-backend/src/config.ts` loads that env
   file with `process.loadEnvFile`, then parses `DPI_PROVIDER`
   (`litellm` | `faux` | OpenRouter fallback) and requires
   `DPI_TOKEN` (32+ chars).
4. **Runtime.** `apps/dpi-backend/src/litellm-provider.ts` resolves
   `LITELLM_API_KEY` per request (stored credential first, then env).
   `apps/dpi-backend/src/jev.ts` reads `TYPESAFE_API_KEY` from the
   backend process env. Agent shells get only basic vars
   (`PATH`, `HOME`, `USER`, `SHELL`, `TMPDIR`, `LANG`, `TERM`) —
   API keys stay in the backend process, never in agent shell env.
5. **Tokens.** Each device generates its own `DPI_TOKEN` in its
   `backend.env`. `just net register <id>` copies it into
   `~/.dpi/network.sqlite` on the operator machine. Clients
   authenticate with URL + bearer token. Tokens never live in
   `dpi-network.yaml` or the repo.

Leakage rule followed in this file: env var *names* and file paths
only — no key/token values, no lengths, no fingerprints, no uids.

## 2. Local agent request flow (short)

- `POST /v1/sessions {name, cwd, model}` → `Store.create` validates
  the model against the device provider, opens a pi-durable `Harness`
  on that session's `agent.sqlite`, and records the session row.
- `POST /v1/sessions/:s/agents/main/messages
  {content, requestId, waitMs}` → `store.send` submits exactly once
  (`requestId` dedupes retries). Without `waitMs` it returns
  `202 queued`; with `waitMs` `store.settled` long-polls (cap 300s)
  and returns `200 done` with the answer text.
- The turn runs model + tools (`read`, `write`, `edit`, `bash`, plus
  playground tools), checkpointed in SQLite. Closing the client never
  stops the agent; a backend restart resumes from checkpoints.
- History and liveness: `GET .../entries`, `GET .../transcript`,
  SSE streams (`/v1/events`, session/agent events). Only
  `GET /healthz` is unauthenticated; every `/v1/*` route needs the
  bearer token (tokenless → 401).

Proven here: a scratch backend with `DPI_PROVIDER=litellm` served
`/v1/device` with `open-weight-smart` / `litellm`, then a full
`messages` turn returned `PONG`. Scratch stopped and removed after.

## Deploy state (verified)

`just net up dpi-dev` runs, idempotently:
create → provision → deploy → env → service → expose → register →
online.

Confirmed live:

- `just net status dpi-dev` → `online`, 0 sessions.
- HTTPS `/healthz` → 200; tokenless `/v1/device` → 401.
- Authenticated `/v1/device` → name `dpi-dev`, default model
  `open-weight-smart`, provider `litellm`.

## What is running right now

- **VM `dpi-dev`: up and online.** No action needed.
- **Local backend: down, no token — expected.** Port 4780 is free and
  `~/.dpi/backend.env` does not exist, so `just net status local`
  reports no token. Bring it up only when wanted:
  `just net up local`, then `just backend run`.
- **Web hub: up on :4781 and serving the UI.** Starting it touches
  neither the branch nor any device; nothing of this work was
  disturbed. Next: open it and drive `dpi-dev` from the browser.

## Next items (deploy + demo)

1. Hub: open `http://localhost:4781`, confirm `dpi-dev` is listed and
   start a session on it from the UI.
2. TUI (optional): `just tui attach dpi-dev`.
3. Proactive demo (`just proactive take`, port 4790): **not yet
   wired for LiteLLM.** Its backend still defaults to an OpenRouter
   model (`anthropic/claude-sonnet-5.5`) and its Jev client still
   falls back to OpenRouter when `TYPESAFE_API_KEY` is absent. With
   `TYPESAFE_API_KEY` exported the Jev side goes direct to TypeSafe;
   the agent-model side still needs a LiteLLM decision before a real
   run. Demo runs also cost inference and bind the port — plan the
   model flag first, then run.
4. Hygiene: keep the stray root `package.json` / `package-lock.json`
   out of git; `just check` stays the gate before any commit.

## Relevant files

- `dpi-network.yaml` (gitignored) / `dpi-network.example.yaml`
- `.env` (gitignored; comments only) / `.env.example`
- `apps/dpi-backend/src/litellm-provider.ts` (new),
  `config.ts`, `store.ts`, `jev.ts`
- `apps/dpi-sdk/src/node/drivers.ts` (`writeEnv`, `localEnv`),
  `apps/dpi-sdk/src/node/config.ts`
- `apps/dpi-backend/src/routes.ts`, `src/main.ts`, `API.md`
- `justfile`, `just/net/mod.just`, `just/backend/mod.just`,
  `just/hub/mod.just`, `just/proactive/mod.just`
