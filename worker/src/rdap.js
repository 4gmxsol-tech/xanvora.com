/**
 * Xanvora Domain Registration Counter — RDAP
 * POST /rdap with {"name":"example","tlds":["com","net","si"]}
 */
const RDAP_BOOTSTRAP = "https://data.iana.org/rdap/dns.json";
const MAX_TLDS = 100;
const FETCH_TIMEOUT_MS = 7000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "https://xanvora.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
function normalizeTld(v) {
  return String(v || "").trim().replace(/^\./, "").toLowerCase();
}
function validLabel(v) {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(v);
}
async function getJson(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Accept: "application/rdap+json, application/json" },
      signal: ctl.signal
    });
  } finally {
    clearTimeout(timer);
  }
}
async function getBootstrap() {
  const cache = caches.default;
  const cacheKey = new Request(RDAP_BOOTSTRAP);
  let cached = await cache.match(cacheKey);
  if (!cached) {
    const res = await getJson(RDAP_BOOTSTRAP);
    if (!res.ok) throw new Error("IANA_RDAP_BOOTSTRAP_HTTP_" + res.status);
    cached = new Response(await res.text(), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" }
    });
    await cache.put(cacheKey, cached.clone());
  }
  return cached.json();
}
function buildRegistryMap(data) {
  const map = {};
  for (const [suffixes, urls] of data.services || []) {
    for (const suffix of suffixes) map[String(suffix).toLowerCase()] = urls;
  }
  return map;
}
async function checkOne(label, tld, registryMap) {
  const urls = registryMap[tld];
  if (!urls?.length) {
    return { tld, status: "unsupported", registered: null, detail: "No RDAP service in IANA bootstrap" };
  }
  const errors = [];
  for (const base of urls) {
    const root = String(base).endsWith("/") ? String(base) : String(base) + "/";
    const url = root + "domain/" + encodeURIComponent(label + "." + tld);
    try {
      const res = await getJson(url);
      if (res.status === 200) {
        const data = await res.json().catch(() => ({}));
        if (data.objectClassName === "domain" || data.ldhName || data.handle) {
          return { tld, status: "registered", registered: true };
        }
        errors.push("HTTP 200 without a recognizable domain object");
        continue;
      }
      if (res.status === 404) return { tld, status: "not_found", registered: false };
      errors.push("HTTP " + res.status);
    } catch (e) {
      errors.push(e?.name === "AbortError" ? "timeout" : String(e?.message || e));
    }
  }
  return { tld, status: "unresolved", registered: null, detail: errors.slice(0, 3) };
}
export async function countRdapRegistrations(body) {
  if (!body || typeof body !== "object") return { error: "JSON object required" };
  const name = String(body.name || "").trim().toLowerCase();
  if (name.includes(".")) return { error: "Pass the base name only, without an extension" };
  if (!validLabel(name)) return { error: "Invalid base label" };
  const input = Array.isArray(body.tlds) ? body.tlds : [];
  if (!input.length || input.length > MAX_TLDS) return { error: "tlds must contain 1 to " + MAX_TLDS + " extensions" };
  const tlds = [...new Set(input.map(normalizeTld))];
  if (tlds.some(tld => !tld || !/^[a-z0-9-]{2,63}$/.test(tld))) return { error: "Invalid TLD" };
  let registryMap;
  try {
    registryMap = buildRegistryMap(await getBootstrap());
  } catch (e) {
    return { error: "RDAP bootstrap unavailable", detail: String(e?.message || e) };
  }
  const results = [];
  const concurrency = 8;
  for (let i = 0; i < tlds.length; i += concurrency) {
    const batch = await Promise.all(tlds.slice(i, i + concurrency).map(tld => checkOne(name, tld, registryMap)));
    results.push(...batch);
  }
  const registered = results.filter(x => x.registered === true).length;
  const notFound = results.filter(x => x.registered === false).length;
  const unresolved = results.filter(x => x.registered === null).length;
  return {
    name,
    checked: results.length,
    registered,
    not_found: notFound,
    unresolved,
    registration_rate_among_resolved: registered + notFound ? Math.round(registered / (registered + notFound) * 1000) / 10 : null,
    results,
    checked_at: new Date().toISOString(),
    note: "RDAP not_found does not guarantee commercial availability. Unresolved results are not counted as registered or available."
  };
}
