# Xanvora AI Planner + RDAP Registration Counter

This Worker provides:
- `/` or `/plan`: secure server-side AI game-command planner.
- `/rdap`: RDAP registration count for a base domain label across provided TLDs.

## Configure AI planner
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler deploy
```

## RDAP registration count
Send `POST /rdap` with JSON:
```json
{
  "name": "example",
  "tlds": ["com", "net", "org", "ai", "si"]
}
```

The endpoint uses the IANA RDAP DNS bootstrap and each TLD's advertised RDAP service. A domain object returned with HTTP 200 is counted as registered; HTTP 404 is counted as not found in RDAP; unsupported or failed requests are counted as unresolved. It does not treat RDAP 404 as a guarantee of commercial availability.

Maximum 100 TLDs per request. Results include counts and per-TLD status. The RDAP module has no dependency on the OpenAI key.

## Security / deployment notes
- The current CORS policy follows the existing planner's behavior. Restrict it to your production origin before public use.
- Add rate limiting / Turnstile or another abuse-prevention mechanism before exposing a public endpoint broadly.
- Do not place API keys in client-side JavaScript.
