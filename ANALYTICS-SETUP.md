# Brothers in Gaming analytics — setup & usage

Cookieless, self-hosted visit analytics running on your Cloudflare Workers
deployment. No third parties, no cookies, no consent banner. Data lives in a
Cloudflare D1 (SQLite) database in **your** account, kept forever.

## What it captures

Per pageview: timestamp, page path, referrer, country / region / city (Cloudflare
edge geo), timezone, screen width, visit duration, and an anonymous daily-rotating
visitor hash used to flag returning-within-the-day visits.

It does **not** store IP addresses or set any cookie. The visitor hash is
`SHA-256(ip + user-agent + UTC-date + secret)` — irreversible, and different every
day so no one can be tracked across days.

## Files added

| File | Purpose |
|------|---------|
| `worker/index.js` | Worker: `/collect`, `/export`, `/stats`, else static site |
| `analytics.js` | Client beacon, loaded on every page |
| `schema.sql` | The `events` table |
| `wrangler.jsonc` | Worker + static-assets + D1 config |
| `package.json` | Pulls in `wrangler` |
| `.dev.vars.example` | Template for local secrets |

---

## One-time setup — dashboard only, **no Node/CLI needed**

Cloudflare builds and deploys from `main` in the cloud. Everything below is done
in your browser + one `git push`.

### 1. Create the D1 database

Cloudflare dashboard → **Storage & Databases → D1** → **Create database**.
- Name it exactly **`brothers_analytics`**.
- Open it and copy its **Database ID**.

### 2. Put the ID in `wrangler.jsonc`

Replace `REPLACE_WITH_DATABASE_ID` with the copied ID.

### 3. Create the table

In that database's **Console** tab, paste the entire contents of `schema.sql`
and run it. (You should see the `events` table appear under **Tables**.)

### 4. Deploy (this creates the Worker)

```bash
git add -A
git commit -m "Add cookieless analytics collector"
git push
```

Cloudflare Workers Builds installs `wrangler` and deploys automatically. Watch it
under **Workers & Pages → brothers-in-gaming → Deployments**.

> ⚠️ Do the database steps 1–2 **before** pushing. A `wrangler.jsonc` pointing at a
> non-existent `database_id` will fail the deploy. Until then, keep these changes
> uncommitted.

### 5. Set the two secrets

After the first deploy, the Worker exists. Go to **Workers & Pages →
brothers-in-gaming → Settings → Variables and Secrets → Add**, type **Secret**,
and add both:

| Name | Value |
|------|-------|
| `SALT_SECRET` | any long random string (salts the anonymous hash) |
| `DASH_TOKEN`  | your dashboard password — keep it private |

Save and **Deploy** the change. Until `DASH_TOKEN` is set, `/stats` and `/export`
return 404 (locked) by design. Collection still works meanwhile.

Need random values? On Windows PowerShell:
```powershell
[Convert]::ToHexString((1..32 | % {Get-Random -Max 256}))
```

---

## Optional: CLI path (only if you later install Node)

```bash
npm install
npx wrangler login
npx wrangler d1 create brothers_analytics          # paste id into wrangler.jsonc
npx wrangler d1 execute brothers_analytics --remote --file=./schema.sql
npx wrangler secret put SALT_SECRET
npx wrangler secret put DASH_TOKEN
npx wrangler deploy                                 # or just git push
```

---

## Viewing your data

- **Dashboard:** `https://www.brothers-in-gaming.com/stats?token=YOUR_DASH_TOKEN`
  Day / week / month counts, top countries, top pages, avg visit time.
- **Spreadsheet:** `https://www.brothers-in-gaming.com/export?token=YOUR_DASH_TOKEN`
  Downloads every event as CSV → open in Excel / Google Sheets → chart away.

Both return `404` without the correct token, so they stay private to you.

## Good to know

- **Cost:** $0 at blog traffic. Cloudflare free tier = 100k Worker req/day, 5 GB D1.
- **Cross-day returning visitors** cannot be identified — that's the privacy
  trade-off of the cookieless design. "Unique visitors" is counted per UTC day.
- **Bots** matching a keyword list are skipped. Adjust `BOT_RE` in
  `worker/index.js` to taste.
