# Journal — proactive demo + Jev review

Started: 2026-10-20. Status: open.

This journal tracks the unfinished review of the proactive demo
(`apps/proactive-dpi-demo`) and the plan to elevate Jev capabilities
from the ten-levels-of-jev work into this framework. One entry per
session, newest at the bottom. No secrets in this file — names only.

## Context

- The proactive demo is a durable incident agent: a watcher sends
  production log rows to Jev; when failures cluster, an incident opens
  and a pi-durable agent works it on its own branch, then waits
  durably for deploy approval. See
  `apps/proactive-dpi-demo/README.md` for the full timeline.
- Current wiring (pre-LiteLLM): the demo's agent model defaults to
  `anthropic/claude-sonnet-5.5` via OpenRouter
  (`apps/proactive-dpi-demo/apps/proactive-dpi-be/src/config.ts`,
  `ops.ts`, `model-catalog.ts`). Its Jev client tries
  `TYPESAFE_API_KEY` first, then falls back to OpenRouter's decisions
  endpoint (`.../jev.ts`).
- The `dpi-backend` Jev client (`apps/dpi-backend/src/jev.ts`) is
  already TypeSafe-only. The demo's Jev client is not yet.
- Ten-levels-of-jev (`../ten-levels-of-jev`, branch `litellm-wiring`)
  is the Jev capability source: 10 levels of bounded Jev calls
  (`apps/ten-levels/src/levels/level01..level10`), plus the
  `jev-guard` extension (bash/write gates + result screening,
  `apps/ten-levels/extensions/jev-guard.ts`) and `jev-compact`.
  Latest there: Jev 100% through TypeSafe, inference through LiteLLM
  (`open-weight-smart`).

## Goal

1. Finish reviewing the proactive demo as-is (run a take, watch the
   incident timeline, approve/decline the deploy).
2. Wire the demo's agent inference to LiteLLM (mirror the
   `dpi-backend` provider work) so a take runs with zero OpenRouter.
3. Make the demo's Jev client TypeSafe-only (drop the OpenRouter
   fallback, mirroring `dpi-backend/src/jev.ts`).
4. Elevate: port the reusable Jev patterns from ten-levels-of-jev
   into this framework — candidates: `jev-guard` bash/write gates
   for incident agents, result screening, confidence-gated tool use.
   Decide per pattern whether it becomes a backend extension, a demo
   ops tool, or stays in the lab repo.

## Ideas backlog (future durable sessions)

- **a. Slack watcher/digester.** A durable session that polls or
  receives Slack, judges rows with Jev, and posts digests. Needs a
  Slack token + a poller tool; the proactive demo's watcher is the
  template (swap log rows for messages).
- **b. Jira + PR watcher/helper.** Same shape: Jev triages issues/PR
  events, a durable agent drafts reviews or updates. Needs Jira/GitHub
  credentials as new `env_keys`.
- **c. k8s watcher / SRE agent.** Jev over cluster events, durable
  agent with `kubectl` instead of `bash`-anywhere. Note: agent shells
  are unsandboxed today — scope the toolset before pointing one at a
  real cluster.

Each of these is one watcher + one durable agent + one approval gate,
i.e. the proactive demo's architecture with different inputs. Build
the second one by copying the demo, not by generalizing prematurely.

## Log

### 2026-10-20 — journal opened

- Answered the cost question: on the Personal plan all VMs share one
  capacity pool (2 vCPU / 4 GiB from $15/mo); adding a small VM costs
  nothing extra while inside the pool. Beyond the pool, standalone
  VMs meter at $0.105 per 2vCPU/4GiB unit-hour. Inference cost is
  per-token via LiteLLM regardless of device count.
- `dpi-dev` + `local` both online, one session each. No new device
  for now; the parked laptop stays a future `kind: ssh` entry.
- Next session: run the proactive demo take and record observations
  here.

### 2026-10-20 — read anthropics/cwc-workshops (short)

Workshop repo, 9 entries. Five map onto our backlog:

- `ship-your-first-managed-agent` → **idea c.** On-call dashboard,
  one agent + runbook skill → commander with one investigator thread
  per page → memory stores (read-only team history + read-write
  agent notebook) → postmortem PDF. Takeaways: runbook-as-skill is
  our extensions/playbook pattern; commander/investigators is our
  `subagent` tool; the notebook (agent-written notes with version
  history) is something our SQLite docs don't have yet; cheap
  investigator models (their haiku vs opus) maps to our LiteLLM
  model choice per role.
- `production-ready-agent` → **idea b.** Coordinator + parallel
  research subagents, reaches Linear via MCP, graded output. Takeaway:
  Jira/PR access is "one tool + one coordinator", same shape.
- `agent-decomposition` → **Jev elevation method.** Decompose a
  400-line prompt into skills + code + callable agents, with evals
  verifying each step. That is the procedure for porting
  ten-levels patterns: one pattern at a time, each with a check.
- `agents-that-remember` → memory primitives (cross-session store +
  transcript consolidation). Our compaction covers consolidation;
  the notebook idea recurs here.
- `rightmodel` → sweep an eval suite across models for
  quality-per-dollar. Useful when we choose which LiteLLM model
  serves which role.

No code taken; Apache 2.0 repo, ideas only. Next: wire the demo to
LiteLLM (see Goal items 2–3), then run the first take.
