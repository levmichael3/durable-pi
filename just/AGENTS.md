# just/

Ops glue: `just` modules delegate to npm/tsx; device id always from `dpi-network.yaml`.

## STRUCTURE
```
justfile              # mod net/backend/hub/tui/test/proactive + install/check
just/net/mod.just     # device fleet: delegates to sdk scripts/net.ts per kind
just/backend/mod.just # this machine's :4780 device server
just/hub/mod.just     # :4781 web UI build/start
just/tui/mod.just     # attach <device>[:<session>[:<agent>]]
just/test/mod.just    # unit/ui free vs device/e2e paid tiers
just/proactive/       # demo take/start/logs
just/free-port.sh     # kill-before-serve helper
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Fleet op | `just/net/mod.just` → `apps/dpi-sdk/scripts/net.ts` | kind drivers, never machines |
| Run device/web | `just/backend`, `just/hub` | free-port then serve |
| Pick suite | `just/test/mod.just` | unit/ui/smoke free; device/e2e real model |
| Demo cycle | `just proactive take` | reset + start :4790 |

## CONVENTIONS
- `set shell := ["zsh", "-cu"]`, `dotenv-load := true` everywhere.
- `net` sets `working-directory := ../../apps/dpi-sdk`; `test` uses `[no-cd]`.
- Device ids via `just net ids` (YAML); never hardcode a machine.
- `just check` = `test::unit` (sdk+backend+playground+tui checks+tests).

## ANTI-PATTERNS
- Never run `device`/`e2e` casually — real model, costs money.
- No CI yaml in repo; effective pipeline is `just check` (+ optional `just test ui`).
