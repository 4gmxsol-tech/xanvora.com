# Neon Dash global leaderboard

The game already includes local profiles, daily challenge progress, unlockable energy cores and score sharing. Global rankings use a separate Cloudflare Worker + D1 database so the existing image-search Worker is not modified.

## 1. Create the D1 database

```bash
cd worker/leaderboard
npx wrangler d1 create xanvora-neon-leaderboard
```

Copy the returned database_id into `wrangler.toml` (replace the placeholder).

## 2. Create the score table

```bash
npx wrangler d1 execute xanvora-neon-leaderboard --remote --file=schema.sql
```

## 3. Deploy the API

```bash
npx wrangler deploy
```

The Worker exposes:
- `GET /health`
- `GET /leaderboard` (top 50)
- `POST /score` (validated score submission, basic per-IP rate limit)

## 4. Connect the game

Add this before the game script in `neon-dash.html`, replacing the URL with the deployed Worker URL:

```html
<script>window.XANVORA_LEADERBOARD_API = "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev";</script>
```

Until this API is deployed and connected, player stats, daily challenge, skins and sharing work locally, while the Global Top 10 panel explains that live rankings are pending.

## Trust and abuse note

This first release is a casual leaderboard. Scores are client-submitted and should not be treated as prize-eligible or tamper-proof. A future competitive release should add authenticated player identities and server-verifiable run telemetry.
