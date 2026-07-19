/* ─────────────────────────────────────────
   Cloudflare Worker — Brothers in Gaming + cookieless analytics collector.

   Routes handled here:
     POST /collect        record a pageview / duration  (public, from the site)
     GET  /export?token=  download every event as CSV    (private)
     GET  /stats?token=   tiny text dashboard            (private)

   Any other request falls through to the static site assets.
───────────────────────────────────────── */

// Obvious non-humans we don't want cluttering the numbers.
const BOT_RE =
  /(bot|crawl|spider|slurp|bing|google|yandex|baidu|duckduck|facebookexternal|preview|monitor|curl|wget|python-requests|headless|lighthouse|pingdom|uptime|semrush|ahrefs)/i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── Canonical URL 301s (SEO: collapse duplicate URLs) ──
    // Only for safe, cacheable reads — never redirect the analytics POST.
    if (request.method === "GET" || request.method === "HEAD") {
      const canonical = canonicalUrl(url);
      if (canonical) return Response.redirect(canonical, 301);
    }

    const path = url.pathname;

    if (path === "/collect" && request.method === "POST") {
      return handleCollect(request, env, ctx);
    }

    if (path === "/export" || path === "/stats") {
      const token = url.searchParams.get("token") || "";
      // 404 (not 401) so the endpoints stay invisible without the token.
      if (!env.DASH_TOKEN || token !== env.DASH_TOKEN) {
        return new Response("Not found", { status: 404 });
      }
      return path === "/export" ? handleExport(env) : handleStats(env, token);
    }

    // Everything else = the static site.
    return env.ASSETS.fetch(request);
  },
};

/* ── Canonical URL ──────────────────────────
   Returns a redirect target string if the request URL isn't canonical:
     • apex/other hosts → www.brothers-in-gaming.com
     • trailing slash stripped (except the site root)
   Returns null when the URL is already canonical (no redirect).             */
function canonicalUrl(url) {
  let changed = false;

  // apex → www (leave localhost / *.workers.dev / preview hosts untouched).
  if (url.hostname === "brothers-in-gaming.com") {
    url.hostname = "www.brothers-in-gaming.com";
    changed = true;
  }

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    changed = true;
  }

  return changed ? url.toString() : null;
}

/* ── Collection ─────────────────────────── */

async function handleCollect(request, env, ctx) {
  // Always answer instantly; do the DB work in the background.
  const ok = new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });

  let data;
  try {
    data = JSON.parse(await request.text());
  } catch (e) {
    return ok;
  }

  const ua = request.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) return ok;

  ctx.waitUntil(record(data, request, env, ua));
  return ok;
}

async function record(data, request, env, ua) {
  const db = env.DB;
  try {
    // Duration beacon: attach elapsed time to the earlier pageview.
    if (data.t === "end") {
      if (!data.vid) return;
      const d = Math.max(0, Math.min(Number(data.d) || 0, 6 * 60 * 60 * 1000)); // cap 6h
      await db
        .prepare(
          "UPDATE events SET duration_ms = ?1 WHERE vid = ?2 AND duration_ms IS NULL"
        )
        .bind(d, String(data.vid))
        .run();
      return;
    }

    if (data.t !== "pv" || !data.vid) return;

    const now = new Date();
    const day = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    const cf = request.cf || {};
    const ip = request.headers.get("cf-connecting-ip") || "";

    // Cookieless, non-reversible visitor id. The daily salt means the same
    // person gets a DIFFERENT hash tomorrow — so no one can be tracked across
    // days, which is exactly why no consent banner is needed.
    const visitor = await visitorHash(ip, ua, day, env.SALT_SECRET || "");

    // "Returning" = this anonymous visitor was already seen earlier *today*.
    const seen = await db
      .prepare(
        "SELECT 1 FROM events WHERE day = ?1 AND visitor_hash = ?2 LIMIT 1"
      )
      .bind(day, visitor)
      .first();

    await db
      .prepare(
        `INSERT INTO events
           (ts, day, vid, visitor_hash, is_returning, path, referrer,
            country, region, city, timezone_edge, timezone_client,
            screen_w, ua, duration_ms)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,NULL)`
      )
      .bind(
        now.toISOString(),
        day,
        String(data.vid),
        visitor,
        seen ? 1 : 0,
        trim(data.p, 300),
        trim(data.r, 500),
        cf.country || "",
        cf.region || "",
        cf.city || "",
        cf.timezone || "",
        trim(data.tz, 60),
        Number(data.sw) || 0,
        trim(ua, 400)
      )
      .run();
  } catch (e) {
    /* analytics must never surface an error to the visitor */
  }
}

async function visitorHash(ip, ua, day, salt) {
  const bytes = new TextEncoder().encode(ip + "|" + ua + "|" + day + "|" + salt);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function trim(v, n) {
  return v == null ? "" : String(v).slice(0, n);
}

/* ── CSV export ─────────────────────────── */

async function handleExport(env) {
  const cols = [
    "ts",
    "day",
    "visitor_hash",
    "is_returning",
    "path",
    "referrer",
    "country",
    "region",
    "city",
    "timezone_edge",
    "timezone_client",
    "screen_w",
    "duration_ms",
    "ua",
  ];

  const { results } = await env.DB.prepare(
    `SELECT ${cols.join(", ")} FROM events ORDER BY ts ASC`
  ).all();

  const lines = [cols.join(",")];
  for (const row of results) {
    lines.push(cols.map((c) => csv(row[c])).join(","));
  }

  return new Response(lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="analytics-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}

function csv(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* ── Tiny stats page ────────────────────── */

async function handleStats(env, token) {
  const db = env.DB;
  const all = (sql) => db.prepare(sql).all().then((r) => r.results);

  const pv = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN day = date('now')            THEN 1 ELSE 0 END) AS today,
         SUM(CASE WHEN day >= date('now','-6 days')  THEN 1 ELSE 0 END) AS week,
         SUM(CASE WHEN day >= date('now','-29 days') THEN 1 ELSE 0 END) AS month,
         COUNT(*) AS all_time
       FROM events`
    )
    .first();

  const uniq = await db
    .prepare(
      `SELECT
         COUNT(DISTINCT CASE WHEN day = date('now') THEN visitor_hash END) AS today,
         COUNT(DISTINCT CASE WHEN day >= date('now','-6 days')  THEN day || visitor_hash END) AS week,
         COUNT(DISTINCT CASE WHEN day >= date('now','-29 days') THEN day || visitor_hash END) AS month
       FROM events`
    )
    .first();

  const daily = await all(
    `SELECT day,
            COUNT(*)                        AS pageviews,
            COUNT(DISTINCT visitor_hash)    AS visitors,
            SUM(is_returning)               AS returning,
            CAST(AVG(NULLIF(duration_ms,0)) / 1000.0 AS INT) AS avg_sec
     FROM events
     WHERE day >= date('now','-29 days')
     GROUP BY day ORDER BY day DESC`
  );

  const countries = await all(
    `SELECT COALESCE(NULLIF(country,''), '??') AS country, COUNT(*) AS n
     FROM events WHERE day >= date('now','-29 days')
     GROUP BY country ORDER BY n DESC LIMIT 15`
  );

  const pages = await all(
    `SELECT COALESCE(NULLIF(path,''), '(none)') AS path, COUNT(*) AS n
     FROM events WHERE day >= date('now','-29 days')
     GROUP BY path ORDER BY n DESC LIMIT 15`
  );

  return new Response(renderStats({ pv, uniq, daily, countries, pages, token }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function renderStats({ pv, uniq, daily, countries, pages, token }) {
  const card = (label, a, b) =>
    `<div class="card"><div class="k">${esc(label)}</div>` +
    `<div class="v">${a}</div><div class="s">${esc(b)}</div></div>`;

  const rows = (arr, cells) =>
    arr.map((r) => "<tr>" + cells(r).map((c) => `<td>${c}</td>`).join("") + "</tr>").join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Brothers in Gaming analytics</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;padding:24px;background:#0d0d0f;color:#e8e8ea;
       font:15px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  h1{font-size:18px;margin:0 0 4px} h2{font-size:14px;margin:28px 0 10px;
       text-transform:uppercase;letter-spacing:.08em;color:#9a9aa2}
  a{color:#7db4ff}
  .cards{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px}
  .card{background:#17171b;border:1px solid #26262c;border-radius:10px;
        padding:12px 16px;min-width:110px}
  .card .k{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8a8a92}
  .card .v{font-size:24px;font-weight:600;margin-top:2px}
  .card .s{font-size:12px;color:#8a8a92}
  table{border-collapse:collapse;width:100%;max-width:760px;margin-top:6px}
  th,td{text-align:left;padding:6px 10px;border-bottom:1px solid #222228;font-size:13px}
  th{color:#9a9aa2;font-weight:500} td{font-variant-numeric:tabular-nums}
  .muted{color:#8a8a92;font-size:12px;margin-top:6px}
</style></head><body>
<h1>Brothers in Gaming analytics</h1>
<div class="muted">Cookieless &middot; UTC days &middot;
  <a href="/export?token=${esc(token)}">⬇ download full CSV</a></div>

<h2>Pageviews</h2>
<div class="cards">
  ${card("Today", pv.today || 0, "pageviews")}
  ${card("7 days", pv.week || 0, "pageviews")}
  ${card("30 days", pv.month || 0, "pageviews")}
  ${card("All time", pv.all_time || 0, "pageviews")}
</div>

<h2>Unique visitors <span class="muted">(per day)</span></h2>
<div class="cards">
  ${card("Today", uniq.today || 0, "visitors")}
  ${card("7 days", uniq.week || 0, "visitor-days")}
  ${card("30 days", uniq.month || 0, "visitor-days")}
</div>

<h2>By day (last 30)</h2>
<table><tr><th>Day</th><th>Pageviews</th><th>Visitors</th>
  <th>Repeat</th><th>Avg time</th></tr>
${rows(daily, (r) => [
  esc(r.day),
  r.pageviews,
  r.visitors,
  r.returning || 0,
  r.avg_sec ? r.avg_sec + "s" : "—",
])}</table>

<h2>Top countries (30 days)</h2>
<table><tr><th>Country</th><th>Pageviews</th></tr>
${rows(countries, (r) => [esc(r.country), r.n])}</table>

<h2>Top pages (30 days)</h2>
<table><tr><th>Path</th><th>Pageviews</th></tr>
${rows(pages, (r) => [esc(r.path), r.n])}</table>

<p class="muted" style="margin-top:28px">
  "Unique visitors" is counted per UTC day. Because the visitor hash rotates
  daily for privacy, multi-day totals count a person once per day they visited,
  and someone returning on a later day cannot be linked to an earlier visit.
</p>
</body></html>`;
}
