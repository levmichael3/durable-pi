# apps/dpi-playground

Laptop hub (:4781) + Vue 3 client; token proxy + multiplexed SSE, thin reducers shell.

## STRUCTURE
```
apps/
├── dpi-playground-hub/src/  # main/mux/monitor/proxy/guard/seed
└── dpi-playground-fe/src/
    ├── main.ts/App.vue      # createApp mount, boot() then stream.start()
    ├── client/              # stream/hub/store/composables/commands/jobs/ids
    └── components/          # NetworkSidebar/Inspector/AgentView/Composer/TranscriptItem…
tests/  # hub.test.ts + *.mjs (network-ui/device-ui/agent-features/browser-close/e2e)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add hub route | `hub/src/main.ts` → `proxy.ts`/`mux.ts` | streams never via proxy |
| Multiplex change | `hub/src/mux.ts` (`StreamMux`) + `monitor.ts` | per-tab subs, `MuxFrame` |
| Web state bug | `fe/src/client/store.ts` + `composables.ts` | module singleton, `useAgent/useSession` |
| Transcript render | `components/TranscriptItem.vue` + `@sdk/transcript` | `item.kind` switch |
| Job cards | `fe/src/client/jobs.ts` reads `agentState.docs[demo.job-runs]` | agent sub carries `?docs=` |

## CONVENTIONS
- One `EventSource(/api/stream)`, 3 slots (device/session/agent); retarget slots, never new ES.
- Sub keys: `<id>/device?docs=…`, `<id>/session/<sid>`, `<id>/agent/<sid>/<aid>?docs=…`.
- No Pinia/router; store imports from `client/store`, `(version.value, expr)` bumps SDK models.
- `AgentView` remounts per session (`:key=device/session`); agent switches preserve scroll via `agent.version`.
- Lint/format here only: `npm run lint`/`fmt` (`oxlint`, `printWidth 100`).

## ANTI-PATTERNS
- UI never edits devices (`hub/src/seed.ts`); YAML/boot is source of truth.
- Inspector never takes a column on narrow — overlay mode (`store.ts:322`).
- No `scoped` styles; global `style/network/jobs/extensions.css`.
- FE has no unit tests; cover via `just test ui` Playwright scripts.
