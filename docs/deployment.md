# Family Hub Deployment

## Target

Production should run on `zivnas` with Docker Compose under `/volume1/docker/family-hub`.

Initial production shape:

```text
zivnas
  family-hub
    Next.js dashboard
    server-side Home Assistant access
```

Later production shape:

```text
zivnas
  family-hub
  family-hub-agent
  postgres
```

## Files

- `Dockerfile` builds a standalone Next.js production image.
- `docker-compose.yml` runs the app on port `3000`.
- `.env.production.example` documents required runtime secrets.

## First Deploy

The production deployment copy is:

```bash
/volume1/docker/family-hub
```

The `zivnas` dev share is visible locally at `/mnt/zivnas/dev`, but this WSL session does not have write permission there. Use `/volume1/docker/family-hub` for production runtime files.

Create the directory from an SSH session:

```bash
mkdir -p /volume1/docker/family-hub
```

Create the production env file from the example if it does not already exist:

```bash
cp .env.production.example .env.production
```

Edit `.env.production`:

```bash
HA_URL=http://homeassistant.local:8123
HA_TOKEN=your-long-lived-access-token
```

Start the app:

```bash
/usr/local/bin/docker-compose up -d --build
```

Check logs:

```bash
/usr/local/bin/docker-compose logs -f family-hub
```

Open:

```text
http://zivnas:3000
```

## Verification

Check these from a browser:

- Dashboard loads.
- Home Assistant status connects.
- Tasks load.
- ChoreOps status loads.
- Lights load.
- Calendar shows setup guidance until HA calendar integration is available.
- One safe light can be toggled.

Check these from the NAS shell:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/home-assistant/status
curl http://localhost:3000/api/home-assistant/calendar
```

## Update Deploy

From the local repo:

```bash
scripts/deploy-zivnas.sh
```

Or run this manually from the repo directory on `zivnas`:

```bash
/usr/local/bin/docker-compose up -d --build
/usr/local/bin/docker-compose logs -f family-hub
```
