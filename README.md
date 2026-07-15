# Brothers in Gaming

Static rebuild of [brothers-in-gaming.com](https://www.brothers-in-gaming.com/),
migrated off Wix to a plain HTML/CSS/JS site on Cloudflare Workers.

- Plain HTML pages + a single `style.css`
- `nav.js` / `footer.js` inject the shared nav + footer client-side
- Cloudflare Worker (`worker/index.js`) serves static assets and a cookieless
  analytics collector — see [ANALYTICS-SETUP.md](ANALYTICS-SETUP.md)

Migration progress and decisions live in [MIGRATION-PLAN.md](MIGRATION-PLAN.md).

## Structure

```
/                 → index.html         (blog listing)
/about-us         → about-us.html
/post/<slug>      → post/<slug>.html   (blog posts — paths kept identical to Wix)
```

## Local dev

```bash
npm install
npm run dev        # wrangler dev → http://localhost:8787
```
