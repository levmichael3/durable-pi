# apps/dpi-tui

Pi-like terminal client; same SDK reducers as web, direct bearer to device.

## STRUCTURE
```
bin/dpi-tui.mjs  # bin → tsx src/main.ts shim
src/
├── main.ts      # parseArgs → registry+YAML resolve → DpiClient → App
├── app.ts       # interactive loop: follow() + AgentModel (15.4K)
├── render.ts    # TranscriptItem/usage/tool blocks → terminal
├── pickers.ts/commands.ts/theme.ts
tests/  # render.test.ts + smoke.sh (tmux screen-grep)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Attach/new flow | `src/main.ts` + `just/tui/mod.just` | `<device>[:<session>[:<agent>]]` |
| Streaming/steer | `src/app.ts` via `DpiClient.follow()` | direct device URL + token |
| Render bug | `src/render.ts` + `@sdk/transcript` | same `TranscriptItem` model as FE |
| Slash command | `src/commands.ts` mirrors FE `client/commands.ts` | keep names in sync |

## CONVENTIONS
- Direct to device (no hub mux); token from `NetworkRegistry` in TUI process.
- `AgentModel` + `follow()`; FE equivalent is `useAgent` over `HubStream` — same reducer.
- Keys: Enter send/steer, Alt+Enter queue follow-up, Esc interrupt, Ctrl+C on empty exits with reattach cmd.
- Imports use `*.ts` (`allowImportingTsExtensions`); backend/hub use `*.js`.

## ANTI-PATTERNS
- Only `render.ts` has unit tests; app/commands/pickers covered by `smoke.sh` — don't add brittle App unit tests.
- Never parse YAML in tui; use `sdk/node/config.ts` (`yaml` dep in tui package.json is unused).
- Agent keeps running after quit; exit message must print reattach command.
