# apps/dpi-sdk

Shared wire contract + client + reducers + registry; imported by path, never a dep.

## STRUCTURE
```
src/
├── api.ts          # v1 types only: API_VERSION, Frame/MuxFrame, Wire* (517)
├── client.ts       # DpiClient + handles, follow() reconnect (328)
├── models.ts       # AgentModel/SessionModel/NetworkModel (423)
├── transcript.ts   # toTranscript/messageText/sumUsage (256)
├── sse.ts/app-state.ts/jobs.ts/errors.ts
├── node/           # laptop-only: registry/config/drivers/ops
│   ├── registry.ts # network.sqlite, toPublic() omits token (273)
│   ├── config.ts   # dpi-network.yaml parse+sync (175)
│   └── drivers.ts/ops.ts # just net per-kind ops (402/114)
scripts/net.ts       # CLI behind every just net verb
tests/               # app-state/compaction/config/models/registry/sse + fixtures
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change wire shape | `api.ts` + backend `contract-check.ts` | keep pi-durable mirror in sync |
| HTTP/SSE use | `client.ts`, `sse.ts` | `DpiClient.events`, `readSse` |
| UI state | `models.ts`, `transcript.ts` | mutate in place + `subscribe()` |
| Fleet add/probe | `scripts/net.ts` → `node/drivers.ts` | kind drivers, never machines |
| Token-safe view | `node/registry.ts:255` | `toPublic()` strips bearer |

## CONVENTIONS
- `src/` browser-safe; `src/node/` needs yaml/sqlite/ssh — never import node from FE.
- Import style per consumer: `../dpi-sdk/src/*.js` (NodeNext) / `*.ts` (tui) / `@sdk/*` (Vite).
- `api.ts` stays wide monolith intentionally; split only via barrel if imports hurt.
- `client.ts:newId()` duplicated in FE `ids.ts` — known, keep in sync.

## ANTI-PATTERNS
- Never hold token in browser; hub proxy injects (`client.ts:37`).
- Secrets on stdin, never argv (`node/ops.ts:2`).
- `client.ts` has no dedicated unit test — covered via backend `api/recovery/streams` integration; don't add mock-server test.
- `dpi-tui/package.json` lists `yaml` unused; parse only via `node/config.ts`.
