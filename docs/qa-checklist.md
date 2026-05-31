# Family Hub QA Checklist

## Local Checks

Run before deployment:

```bash
npm run lint
npm run build
```

Optional local smoke:

```bash
npm run dev
curl http://localhost:3000/api/health
curl http://localhost:3000/api/home-assistant/status
curl http://localhost:3000/api/home-assistant/scripts
```

## NAS Checks

Deploy:

```bash
scripts/deploy-zivnas.sh
```

Verify container:

```bash
ssh pezadmin@zivnas 'cd /volume1/docker/family-hub && PATH=/usr/local/bin:$PATH /usr/local/bin/docker-compose ps'
```

Verify endpoints:

```bash
curl http://zivnas:3000/api/health
curl http://zivnas:3000/api/home-assistant/status
curl http://zivnas:3000/api/home-assistant/scripts
```

Expected baseline:

- Dashboard returns `200`.
- Home Assistant status is `connected: true`.
- Home Assistant reports roughly 360 entities.
- Light count is roughly 59.
- Calendar returns connected with setup warning until HA calendars are configured.
- Scripts endpoint returns only approved scripts.
- Unapproved script calls return `403`.

## Browser Checks

Desktop:

- Open `http://zivnas:3000`.
- Confirm Smart Home, Household Signals, Lights, Routines, Tasks, Calendar, Family Focus, and Colton panels render.
- Toggle one harmless light.
- Confirm tasks can still add/complete items.

iPad:

- Open `http://zivnas:3000`.
- Confirm no horizontal scrolling.
- Confirm tap targets are usable.
- Confirm Lights and Routines panels are reachable without layout breakage.

## Security Checks

Do not commit:

- `.env.local`
- `.env.production`
- Home Assistant long-lived access token

Check allowlists:

- `FAMILY_HUB_APPROVED_SCRIPTS` contains only safe `script.*` routines.
- No lock, security, garage, or arbitrary service-call controls are exposed.

## Backup Checks

- Git commit is pushed to origin.
- Git tag exists for the stable baseline.
- `/volume1/docker/family-hub/.env.production` is backed up through Synology backup or a secure secrets backup.
