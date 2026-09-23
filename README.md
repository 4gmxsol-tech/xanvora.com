# Xanvora

Xanvora is an experimental AI-native 3D world designed to run in the browser.

## v0.2 — AI command boundary

The prototype now separates the game engine from the AI planner:

`Player intent → AI planner → validated game command → world state → 3D renderer`

The browser can use a secure remote planner endpoint, while retaining a local keyword fallback when no endpoint is configured.

### Current game actions

- `create_building` → house near the tree
- `set_guardian` → enable/disable robot guardian mode
- `reset_world` → remove the house and reset guardian mode

The server-side planner only returns actions from this allow-list. Unknown model output is rejected before it reaches the game.

## Browser

- Three.js 3D scene
- WASD / Arrow keys to move
- Click the robot
- Enter natural-language world commands

## Secure AI planner

The optional Cloudflare Worker lives in `worker/`.

It calls the OpenAI Responses API from the server side, so the API key is **not** shipped to the browser. The default model is `gpt-5.6-luna`.

Deploy the Worker:

```bash
cd worker
npx wrangler secret put OPENAI_API_KEY
npx wrangler deploy
```

Then set the deployed Worker URL in `index.html`:

```js
window.XANVORA_AI_API_URL = "https://YOUR-WORKER-URL";
```

Do not put `OPENAI_API_KEY` in `index.html`, GitHub Pages, or any client-side JavaScript.

## Architecture

```
Browser / GitHub Pages
        |
        | POST { command }
        v
Cloudflare Worker
        |
        | server-side API request
        v
AI planner
        |
        | strict structured action
        v
Allow-list validator
        |
        v
Three.js world state
```

## Direction

The long-term goal is not a chatbot attached to a game. Xanvora is intended to make natural language a control layer for a persistent simulated world: AI plans, the engine validates, and the world changes.

## License

MIT
