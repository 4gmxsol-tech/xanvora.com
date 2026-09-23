# Xanvora AI Planner

This Worker is the secure server-side bridge between the browser game and an AI model.

## Why a Worker?

The GitHub Pages frontend must never contain an AI API key. The browser sends a command to this Worker; the Worker calls the model with the secret stored as a Cloudflare secret.

## Configure

Set the secret:

```bash
npx wrangler secret put OPENAI_API_KEY
```

Then deploy:

```bash
npx wrangler deploy
```

The frontend can point to the deployed Worker by setting `window.XANVORA_AI_API_URL` in `index.html`.

The Worker validates the model output against a small allow-list before the game can execute it.

Current model default: `gpt-5.6-luna`. Change `OPENAI_MODEL` in `wrangler.toml` if needed.
