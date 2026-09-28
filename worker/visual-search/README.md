# Xanvora Visual Search Worker

Server-side connector for Xanvora public-source visual search.

## Provider
SerpApi Google Lens. It supports direct image uploads: upload to the Image API, receive a temporary image ID, then query Google Lens with that ID. The documented upload limit is 500 KB and the image ID expires after 10 minutes.

## Deploy
From this directory:
```bash
npx wrangler login
npx wrangler secret put SERPAPI_KEY
npx wrangler deploy
```

Then map the worker to an API hostname such as `api.xanvora.com` and configure the frontend:
```js
window.XANVORA_VISUAL_SEARCH_API_URL = "https://api.xanvora.com/search";
```

Never put the SerpApi key in frontend code.
