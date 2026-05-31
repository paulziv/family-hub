# Family Hub Project Plan

## Objective

Family Hub should become the household control surface and assistant layer for Home Assistant:

- iPad-friendly dashboards for daily household control.
- Safe Home Assistant operations for lights, tasks, calendars, and kid workflows.
- A persistent Synology-hosted agent that observes the home, learns patterns, recommends improvements, and performs approved actions.
- Text-first control with a clean path to voice.

## Current Baseline

- Next.js dashboard app builds successfully.
- Home Assistant credentials are server-side through `HA_URL` and `HA_TOKEN`.
- Working API surfaces:
  - `/api/health`
  - `/api/home-assistant/status`
  - `/api/home-assistant/tasks`
  - `/api/home-assistant/lights`
  - `/api/home-assistant/choreops`
- Known Home Assistant state from local runtime check:
  - Home Assistant connected.
  - 360 total entities.
  - 59 light entities.
  - `todo.shopping_list` available.
  - ChoreOps update entity detected.
- Known gaps:
  - Calendar route detects Home Assistant `404` and shows setup guidance, but HA calendars are not configured yet.
  - ChoreOps appears installed but not configured as an active integration.
  - Dashboard is read-heavy; light/task controls are limited.
  - No persistent agent service or memory store yet.

## Workstreams

### 1. Basic HA Deployment And iPad Dashboard

Goal: make Family Hub useful as a wall/tablet dashboard before adding deeper autonomy.

Scope:

- Stabilize Home Assistant connectivity.
- Fix calendar discovery or gracefully hide calendar until configured.
- Make iPad dashboard layout predictable in landscape and portrait.
- Add practical control panels for common household actions.
- Keep all HA secrets server-side.

Initial tasks:

- Fix lint issues in `Dashboard.tsx` and `homeAssistant.ts`.
- Add dashboard health states for partial HA failures.
- Add light grouping by area or inferred room.
- Add light control actions for approved lights or groups.
- Add task add/complete flows with better pending/error feedback.
- Resolve calendar API behavior:
  - detect whether calendar integration is unavailable,
  - avoid presenting 404 as generic connection failure,
  - show setup guidance in the panel.
- Add an iPad display mode:
  - large tap targets,
  - no horizontal overflow,
  - dense but readable panels,
  - stable card dimensions,
  - good contrast from across a room.
- Define the first Home Assistant scripts the UI can call, such as:
  - evening lights,
  - bedtime routine,
  - house shutdown,
  - movie mode,
  - morning routine.

Acceptance criteria:

- `npm run build` passes.
- `npm run lint` passes.
- Dashboard loads with degraded states when one HA subsystem fails.
- iPad layout is visually verified.
- Approved light/task/script actions work from the dashboard.

### 2. Synology Agent Foundation

Goal: run a persistent sidecar service on the Synology DS918+ that can observe and reason over Home Assistant state.

Recommended stack:

- Node.js/TypeScript service for the agent.
- Docker Compose on Synology.
- Postgres for durable memory and audit logs.
- Optional Redis later for queues and rate limits.

Core services:

- `family-hub-agent`
  - Home Assistant client.
  - Agent API.
  - MCP-compatible tools.
  - Scheduler/observer loop.
  - Policy enforcement.
- `postgres`
  - entity snapshots,
  - observations,
  - recommendations,
  - user preferences,
  - audit log.

Initial agent tools:

- Read-only:
  - `get_home_status`
  - `list_entities`
  - `list_lights`
  - `list_tasks`
  - `check_choreops`
  - `get_unavailable_devices`
  - `get_recent_observations`
- Controlled writes:
  - `turn_light_on`
  - `turn_light_off`
  - `add_task`
  - `complete_task`
  - `run_approved_script`

Explicitly out of scope for the first pass:

- arbitrary Home Assistant service calls,
- unlocking/opening anything,
- security system control,
- editing automations without approval,
- broad device control outside approved domains.

Acceptance criteria:

- Agent runs in Docker on Synology or locally with the same Compose file.
- Agent can connect to Home Assistant with scoped credentials.
- Agent stores periodic observations.
- Agent exposes safe tools.
- Every write action is recorded in an audit log.

### 3. Learning And Optimization

Goal: let the agent learn household usage patterns and recommend improvements without silently changing the home.

Observation model:

- entity availability,
- light on/off state over time,
- manual controls that repeat,
- task creation/completion patterns,
- presence and routine signals,
- ChoreOps readiness,
- failed or flaky devices.

Recommendation types:

- "This light is commonly left on after midnight."
- "These devices are frequently unavailable."
- "This manual action happens repeatedly and may be a good automation."
- "This task pattern appears weekly."
- "This routine should probably be a Home Assistant script."

Control policy:

- The agent may observe automatically.
- The agent may recommend automatically.
- The agent may execute low-risk approved commands when explicitly asked.
- The agent must request approval before changing automations, scripts, security, locks, or access-related settings.

Acceptance criteria:

- Daily summary can be generated from stored observations.
- Recommendations include evidence and proposed action.
- User approval/rejection is stored so the agent learns preferences.

### 4. Text And Voice Interface

Goal: provide a clean control surface that supports chat first and voice second.

Text first:

- Add a chat/control panel to Family Hub.
- Route requests through the agent API.
- Show tool calls, confirmations, and outcomes in a concise household-friendly format.

Voice second:

- Use the same agent API as chat.
- Browser or mobile microphone input.
- Speech-to-text before agent request.
- Optional text-to-speech for responses.
- Require confirmation for risky or ambiguous actions.

Acceptance criteria:

- Text command works for safe actions, status checks, and recommendations.
- Voice command uses the same policy layer as text.
- Ambiguous commands ask a clarifying question instead of guessing.

## Security And Safety Rules

- Store Home Assistant credentials only in server/container environment variables.
- Use least-privilege HA users/tokens where practical.
- Prefer HA scripts for multi-device routines.
- Never expose arbitrary service-call access to the model.
- Maintain an audit log for every write action.
- Separate observed facts from model-generated recommendations.
- Require confirmation for high-impact changes.

## Near-Term Backlog

1. Make current dashboard lint-clean.
2. Improve Home Assistant error modeling, especially calendar `404`.
3. Add iPad dashboard polish and visual verification.
4. Add approved light controls.
5. Add approved HA script controls.
6. Create `agent/` workspace with Docker Compose.
7. Extract or share Home Assistant client logic.
8. Add Postgres schema for observations and audit logs.
9. Add observer loop for lights, tasks, ChoreOps, and unavailable devices.
10. Add text chat/control panel in Family Hub.
11. Add recommendation generation.
12. Add voice input once text flow is reliable.

## Open Decisions

- Whether the agent lives in this repo under `agent/` or in a sibling repo.
- Whether initial persistence should be Postgres only or SQLite for the prototype.
- Which Home Assistant scripts should be approved first.
- Which entities should be excluded from all agent control.
- Whether voice should use browser-native speech APIs first or a dedicated speech service.
