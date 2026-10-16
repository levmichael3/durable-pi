# apps/proactive-dpi-demo

Standalone Jev proactive-SRE story (:4790); no dpi-sdk, direct pi-durable.

## STRUCTURE
```
scripts/      # demo.ts (backend→logs orchestrator), reset.ts (fresh .data + git)
shared/       # paths/log-store(types+sqlite)/lock — owned by logs+be jointly
apps/
├── proactive-dpi-logs/src/  # mock Cloud Run traffic + timed bad deploy
├── proactive-dpi-be/src/    # main/watcher/jev/watch-store/ops/extensions/traffic/deploys
└── proactive-dpi-fe/src/    # api.ts + components AgentChat/EventStream/IncidentCard
mock-repo-template/  # 01-initial/02-regional-tax/03-loyalty overlays + commits.json
workspace/ (.gitignored)  # generated checkout-api + incidents/<inc-*> worktrees
.data/ (.gitignored)      # logs.sqlite/watch.sqlite/agent.sqlite/tts/demo.log
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Classify tuning | `be/src/jev.ts` + `watcher.ts` QUESTIONS | verdict choice + impact score |
| Threshold change | `watcher.ts` fingerprint count/window | default 3 incident / 8 suspicious |
| Incident open | `be/src/ops.ts:openIncident` | atomic doc + ownerless convo + requestId |
| Deploy gate | `be/src/extensions.ts:DeployTask` | approval→rollout→verify, survives SIGKILL |
| UI approve | `POST /api/deploys/:id/decide` | `ops.decideDeploy`, voice on first wait |

## CONVENTIONS
- Code owns thresholds/side effects; Jev one concurrent call per row only.
- `requestId: incident:<id>:brief` dedupes brief after restart.
- One PID lock per sqlite (`shared/lock.ts`); logs DB by stream proc, agent DB by be.
- Run via `just proactive take` (reset+start); flags `--bug-at/--rate` go to logs proc.

## ANTI-PATTERNS
- Never Jev for thresholds or deploys; bounded judgments only.
- Closing tabs never cancels work; browsers are view-only SSE.
- No login, agents run `bash`; keep bind `127.0.0.1` unless `--host 0.0.0.0` intended.
- Templates use `test/` singular + `node --test`; not part of `just check`.
