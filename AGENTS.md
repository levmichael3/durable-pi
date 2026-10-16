# PROJECT KNOWLEDGE BASE

**Generated:** 2026-10-13T07:57:32Z
**Commit:** 37165c6
**Branch:** main

## OVERVIEW
Durable Pi: device-owned durable agents (pi-durable 1.0.3) over one `/v1` + SSE API. TS/Node ESM, Vue 3 hub, `just` orchestration, no root package.

## STRUCTURE
```
./
├── apps/dpi-sdk/            # wire contract + client + registry (imported by path)
├── apps/dpi-backend/        # device server :4780, owns agent.sqlite
├── apps/dpi-playground/     # hub :4781 + Vue client (npm workspaces apps/*)
├── apps/dpi-tui/            # terminal client, same reducers as web
├── apps/proactive-dpi-demo/ # standalone Jev demo :4790, no dpi-sdk
├── just/                    # net, backend, hub, tui, test, proactive (mod.just each)
├── ai_docs/                 # pi/ = upstream, durable_pi/ = this repo spec
└── .claude/                 # install/prime commands, exe-dev skill
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| v1 API surface | `apps/dpi-backend/API.md`, `src/routes.ts` | bearer `DPI_TOKEN`, `requestId` idempotent |
| Wire contract | `apps/dpi-sdk/src/api.ts` | types-only, `API_VERSION`, `Frame`/`MuxFrame` |
| Device ops | `apps/dpi-sdk/scripts/net.ts` + `src/node/drivers.ts` | behind `just net <verb> <id>` |
| Hub proxy/mux | `apps/dpi-playground/apps/dpi-playground-hub/src/` | `proxy.ts` injects token, `mux.ts` multiplexes SSE |
| Web state | `apps/dpi-playground/apps/dpi-playground-fe/src/client/` | `HubStream` + `store.ts` module singleton |
| TUI | `apps/dpi-tui/src/app.ts`, `render.ts` | `follow()` + `AgentModel` direct to device |
| Demo story | `apps/proactive-dpi-demo/README.md`, `scripts/demo.ts` | Jev classify → incident → durable deploy approval |
| Fleet config | `dpi-network.example.yaml` → `dpi-network.yaml` | ids feed `just net ids`, `just test devices` |

## CODE MAP
LSP unavailable (no typescript-language-server); symbols from exports/grep.

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Store` | class | `apps/dpi-backend/src/store.ts` (1191 lines) | catalog + sessions + agents + streams |
| `DpiClient` | class | `apps/dpi-sdk/src/client.ts` | HTTP + SSE to `/v1`, used by hub/tui/tests |
| `NetworkRegistry` | class | `apps/dpi-sdk/src/node/registry.ts` | `~/.dpi/network.sqlite`, `toPublic()` omits token |
| `AgentModel`/`SessionModel` | class | `apps/dpi-sdk/src/models.ts` | reducers; fe `composables.ts` + tui share them |
| `StreamMux`/`DeviceMonitor` | class | `dpi-playground-hub/src/mux.ts`, `monitor.ts` | one SSE per tab, per-slot subs |
| `createJobs`/`phaseApi` | factory | `apps/dpi-backend/src/jobs.ts` (790) | durable job engine + demo handlers |
| `createPlayground` | factory | `apps/dpi-backend/src/extensions.ts` (510) | 10 harness tools + prompt section |
| `Watcher`/`Ops.open` | class | `proactive-dpi-be/src/watcher.ts`, `ops.ts` | log tail → Jev → incident → `DeployTask` |

## CONVENTIONS
- No root workspace. `just install` = 4x `npm install --no-audit --no-fund` (sdk, backend, playground, tui); demo needs `just proactive install`.
- SDK linked by path, not package: `../../dpi-sdk/src/*.js` (NodeNext) / `*.ts` (tui) / `@sdk/*` (Vite). Never add `dpi-sdk` to deps.
- `src/main.ts` everywhere, run via `tsx` (no build for backend/sdk/tui). Typecheck = `tsc --noEmit`.
- Servers: `NodeNext` + `strict` + `target ES2023`; Vite/Vue: `Bundler` + `allowImportingTsExtensions`.
- `just` shell `zsh -cu`, `dotenv-load := true`. Device id always from `dpi-network.yaml`.
- Tests: `tsx --test tests/*.test.ts` (unit, free) vs `.mjs` Playwright/fetch + `smoke.sh` tmux (paid `device`/`e2e` need real model).

## ANTI-PATTERNS (THIS PROJECT)
- Never commit secrets: tokens in `~/.dpi/backend.env`, never `dpi-network.yaml` (`# Tokens never live here`).
- Never let browser hold token: hub `proxy.ts` injects, FE `hub.ts` tokenless. Same for TUI process boundary.
- Never assume stream close stops work: `streams.ts` viewers-only; closing SSE never aborts run.
- Never double-page/double-send: `requestId` admitted once; `store.ts:437` crash never resends prompt.
- Never import `dpi-sdk/src/node/*` from browser: Node-only (`yaml`, sqlite, ssh).
- No `// TODO|FIXME|HACK` in `apps/**/*.ts` (0 hits); keep it that way. Docs prose `NEVER` = invariants, not debt.
- `smart_ass_opus_fix.md` style rules apply to agent prompts, not runtime code.

## UNIQUE STYLES
- Double `apps/`: `apps/dpi-playground/apps/` = product vs deployable (hub/fe). Same for proactive demo.
- One process serves API+SPA: hub/proactive-be embed Vite dev, `express.static(dist)` prod.
- Module singleton store, not Pinia: FE `client/store.ts` exports refs; `(version.value, expr)` comma trick for SDK model reactivity.
- Sub keys mirror model: `<id>/device?docs=…`, `<id>/session/<sid>`, `<id>/agent/<sid>/<aid>?docs=demo.job-runs,demo.workspace`.
- `just/test/mod.just` tier split explicit: `unit`/`ui` free, `device`/`e2e` cost money.

## COMMANDS
```bash
just install && just net up local && just hub build
just check                 # = just test unit (sdk+backend+playground+tui)
just backend run           # :4780 device server
just hub start             # :4781 web UI (second terminal)
just tui attach local[:<session>[:<agent>]]
just test ui               # 28 faux-device web checks, free
just test device <id>      # real model, costs money
just proactive take        # reset + run demo :4790
```

## NOTES
- No `.github/`, no Dockerfile. Effective CI = `just check` (+ optional `just test ui`).
- Backend binds `127.0.0.1` unless YAML `host` sets `0.0.0.0` (ssh/exe-dev). Hub binds `127.0.0.1`, checks Host/Origin.
- `dpi-backend/.nvmrc` = 24, `engines` says `>=22.19.0`; README targets Node 24, TS 5.9.3 pinned.
- Playground lint only: `oxlint`/`oxfmt` (`printWidth 100`) in `apps/dpi-playground`; proactive demo has none.
- pi-durable drift guarded by `contract-check.ts` vs `Wire*` types; `api.ts` stays wide monolith intentionally.
