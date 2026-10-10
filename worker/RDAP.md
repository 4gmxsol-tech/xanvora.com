# Xanvora AI Planner + RDAP Registration Counter

This Worker provides:
- `/` or `/plan`: secure server-side AI game-command planner.
- `/rdap`: RDAP registration count for a base domain label across provided TLDs.

## Deploy
```bash
cd worker
npx wrangler deploy
```

The RDAP route requires no Atom or OpenAI API key. It retrieves the IANA RDAP DNS bootstrap and queries each advertised registry RDAP service.

## RDAP request
Send `POST /rdap` to the deployed Worker:
```json
{
  "name": "example",
  "tlds": ["com", "net", "org", "ai", "si"]
}
```

Use the base label only, without a suffix. Maximum 100 TLDs per request.

## Response interpretation
- `registered`: RDAP returned a recognizable domain object (HTTP 200).
- `not_found`: RDAP returned HTTP 404. This is not a guarantee of commercial availability.
- `unresolved`: unsupported TLD, timeout, or failed registry response. Never count this as registered or available.

Response includes aggregate counts, per-TLD outcomes, timestamp, and registration rate among resolved results. RDAP registration checks are not appraisal estimates.

## Security
- CORS is restricted to `https://xanvora.com`.
- Add rate limiting or Turnstile before broad public exposure.
- Never put private API keys in client-side JavaScript.
