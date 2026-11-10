# apps/dpi-backend

Device server: owns harnesses + SQLite, serves `/v1` + SSE on :4780.

## STRUCTURE
```
src/
├── main.ts            # loadConfig → Store.open → Express /healthz + /v1
├── routes.ts          # thin: bearerAuth + v1(store) delegation (182 lines)
├── store.ts           # fat: Store catalog/sessions/agents/streams (1191)
├── jobs.ts            # durable job engine + demo handlers (790)
├── extensions.ts      # createPlayground: 10 tools + prompt section (510)
├── streams.ts         # viewers-only SSE, throttle helper
├── shared-state.ts/history.ts/jev.ts/addons.ts/faux.ts
├── auth.ts/errors.ts/config.ts/idempotency.ts/model-catalog.ts/contract-check.ts
deploy/  # dpi-backend.service, plist, backend.env.example
prompts/ # system-prompts extension sources
scripts/ # token.ts, migrate-playground.ts
tests/   # api/history/recovery/shared-state/store/streams + helpers.ts
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add route | `routes.ts` → `store.ts` method | routes never hold logic |
| Session/agent lifecycle | `store.ts:363-945` | `spawnSession`, `openAgent`, `settled` |
| Durable jobs | `jobs.ts:375-780` `createJobs`/`phaseApi` | `JOB_DEFS` + `HANDLERS` split seam |
| Stream semantics | `streams.ts:3,76` | close never aborts; at-most-once/ms |
| Contract drift | `contract-check.ts` vs `dpi-sdk/src/api.ts` | pi-durable `Wire*` mirror |

## CONVENTIONS
- Thin routes, fat `Store`: resolve session → harness → mutate → `notify()`.
- Every send needs `requestId`; `store.ts:437` crash never double-sends.
- `configure()` refits compaction when model window shrinks.
- Read-only mode filters `WRITE_TOOLS` before model call.
- Tests boot real server: `helpers.bootServer()` + `DPI_PROVIDER=faux`.

## ANTI-PATTERNS
- Never abort work on viewer disconnect; `streams.test.ts:92` pins this.
- Task labels immutable once known (`store.ts:157`).
- No direct `DpiClient`/`node/*` in `src/` prod code (tests only).
- No `// TODO|FIXME|HACK` in `src/`; prompts `NEVER` = model instructions.
