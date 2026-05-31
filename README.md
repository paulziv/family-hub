# Family Hub

Family Hub is a Next.js dashboard for Home Assistant household status, iPad control panels, shared tasks, lights, calendars, ChoreOps readiness, and approved routines.

Production runs on `zivnas` in Docker at:

```text
http://zivnas:3000
```

## Current Capabilities

- Home Assistant health and entity summary.
- Light inventory with approved on/off controls.
- Home Assistant to-do list read/add/complete.
- Calendar panel with setup guidance when HA calendar integration is unavailable.
- ChoreOps readiness panel.
- Allowlisted Home Assistant script/routine controls.
- Docker deployment to Synology.

## Local Development

Install dependencies:

```bash
npm install
```

Create local env:

```bash
cp .env.example .env.local
```

Required env:

```bash
HA_URL=http://homeassistant.local:8123
HA_TOKEN=your-long-lived-access-token
FAMILY_HUB_APPROVED_SCRIPTS=script.great_room_led_kick
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

```bash
npm run lint
npm run build
```

API smoke checks:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/home-assistant/status
curl http://localhost:3000/api/home-assistant/scripts
```

## Deployment

Production files live on `zivnas` at:

```bash
/volume1/docker/family-hub
```

Deploy from the local repo:

```bash
scripts/deploy-zivnas.sh
```

The deploy script:

- runs local lint,
- runs local production build,
- syncs source to `zivnas`,
- preserves `/volume1/docker/family-hub/.env.production`,
- rebuilds the Docker image,
- restarts the `family-hub` container.

See [docs/deployment.md](docs/deployment.md) for the full NAS runbook.

## Security Model

- Home Assistant credentials stay server-side in `.env.local` or NAS `.env.production`.
- Do not use `NEXT_PUBLIC_*` for Home Assistant secrets.
- Light controls are restricted to `light.*` entities.
- Routine controls are restricted to `FAMILY_HUB_APPROVED_SCRIPTS`.
- Arbitrary Home Assistant service calls are intentionally not exposed.

## Roadmap

See [docs/project-plan.md](docs/project-plan.md).
