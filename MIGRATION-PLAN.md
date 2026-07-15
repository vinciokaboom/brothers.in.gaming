# Brothers in Gaming — Wix → Cloudflare Migration Plan

> Handoff doc for a fresh Claude Code session. Read this first, then start at "Next step".

## Progress log
- **Phase 0 — DONE.** Scaffold copied from portfolio repo & renamed to `brothers-in-gaming`:
  `wrangler.jsonc` (D1 `brothers_analytics`, id still `REPLACE_WITH_DATABASE_ID`),
  `worker/index.js`, `analytics.js`, `schema.sql`, `package.json`, `.gitignore`,
  `.assetsignore`, `.dev.vars.example`, `robots.txt`, `sitemap.xml` (all 11 Wix paths),
  `README.md`, `ANALYTICS-SETUP.md`, `Assets/`, and placeholder `index.html` + `about-us.html`.
- **Phase 1 — DONE.** Inspected live Wix CSS. Tokens: body **Raleway** (Google Fonts, exact),
  headings **Montserrat** (stand-in for Wix's proprietary Avenir 85 Heavy), brand blue
  **#004298**, headings **#323232**, body **#1a1a1a**, content column **~740px**. Built the
  design system in `style.css` and the reusable post template `post/_template.html` (full SEO
  head + JSON-LD, hero, kicker, byline, TOC, h2/h3, figure+caption, blockquote, newsletter stub).
  Verified via a local PowerShell HTTP server (no Node here — Cloudflare builds in cloud):
  nav/footer inject, both fonts load, H1 = Montserrat 800/40px/#323232, body = Raleway 18px/1.65.
  Captured Balatro's original SEO metadata (JSON-LD BlogPosting, OG, canonical, dates) for Phase 4.
  - Wix screenshots + MCP browser `file://` are both blocked in this env; use the PowerShell
    static server (`scratchpad/serve.ps1` pattern) on http://localhost for local visual checks.
- **APPROVAL GATE (Balatro) — BUILT, awaiting owner sign-off.** `post/balatro.html` fully styled
  from the template: scraped the real rendered article (153 blocks → 8×h2, 16×h3, 91×p, 17 figures
  w/ 6 captions), rewrote Wix `#viewer-*` jump-anchors to clean ids, TOC to 4 chapters, full SEO
  head + JSON-LD. All 19 images self-hosted in `Assets/balatro/` and re-compressed with .NET
  System.Drawing (no ffmpeg/imagemagick/node here): **28 MB → 2.4 MB** for the 18 stills (JPEG q85,
  max-width 1400, flattened on white). Originals kept in `Assets/balatro/raw/` (git+assets ignored).
  Verified via local server: nav/footer inject, fonts load, all images 200, all TOC/body anchors
  resolve.
  - **Open issue — the one animated GIF (`balatro-17.gif`) is 12 MB** and can't be optimized here
    (no video tooling). Recommend converting to MP4/WebM (~10–20× smaller) with ffmpeg later, or
    accept as-is. Everything else is web-light.
  - **Balatro APPROVED by owner** (2026-07-15) after two changes: removed the kicker + the top hero
    image (Wix original had no hero). Read time corrected to the real Wix value (20 min). Template
    updated to match (no kicker/hero default).
- **Home + About — DONE** (owner asked to finalize these before mass production, to deploy a preview
  for his brother). Scraped all 9 posts' real metadata (title = post `h1`, date from schema, read
  time from `time-to-read` hook, excerpt from og:description, thumbnail from og:image).
  - `index.html`: responsive card grid of **all 9 posts, newest first** (Wix only featured 4). 9
    thumbnails center-cropped to 16:9 → `Assets/thumbs/` (514 KB total).
  - `about-us.html`: real bios for Vincenzo (Off-Leash, Stockholm) & Michele (SEGA Japan, Tokyo),
    circular photos in `Assets/about/`, real LinkedIn URLs (Michele's placeholder was correct),
    ©2025 footer. Verified via local server: nav active-states, footer, all images 200, fonts load.
  - `sitemap.xml` now carries real `<lastmod>` dates.
- **Next: owner deploying to Cloudflare** for a preview (to show his brother) BEFORE Phase 2 mass
  migration of the remaining 8 posts.



## Goal
Rebuild the Wix site **https://www.brothers-in-gaming.com/** as a plain static site
(HTML/CSS/JS) hosted for free on **Cloudflare**, staying as close as possible to the
original look and preserving SEO (the Wix site is well-indexed). All blog content must be
copied over. Once done, the owner will flip DNS from Wix to the new site.

## Tech approach
Clone the stack already proven in the sibling repo **`vincenzo.catano.portfolio`**
(attach it as a secondary working directory to reference it):
- Plain HTML pages + a single `style.css`
- `nav.js` / `footer.js` injected client-side for shared chrome
- Cloudflare Workers serving static assets via `wrangler.jsonc` (`assets` binding)
- Cookieless analytics via a Worker + D1 (`analytics.js`, `schema.sql`, `worker/`) —
  see that repo's `ANALYTICS-SETUP.md`

## Owner's decisions (already made — do not re-ask)
1. **Design fidelity:** Close but cleaner — match Wix fonts/colors/blog layout, rebuilt as
   clean lightweight HTML/CSS. Not pixel-perfect.
2. **Newsletter:** Embed a third-party email service (Buttondown / Beehiiv / Mailchimp).
   Owner will pick/provide the account when we reach Phase 3. Stub it until then.
3. **Cadence:** Post-by-post with owner approval. Scaffold + design first, style ONE post,
   get approval, then migrate the rest.
4. **Domain:** Stays exactly `www.brothers-in-gaming.com`. URLs must stay identical →
   best case for SEO. Preserve all paths, add matching sitemap + 301s for edge cases.

## Content inventory (from Wix sitemaps)

### Pages
- Home (blog listing) — `/`
- About us — `/about-us` (bios for Vincenzo Catano & Michele Catano, circular profile
  photos, LinkedIn links, ©2025 footer)

### Blog posts — all live at `/post/<slug>` (KEEP THESE PATHS)
| Slug | Title | Notes |
|---|---|---|
| balatro | Balatro: How a solo dev sold 1M+ copies in a month | Heaviest: ~6,500–7,000 words, 12–15 images, TOC/jump links, appendix |
| lorelei | Lorelei and The Laser Eyes: An Indie Masterpiece | ~12 min read |
| omori | OMORI | — |
| bokura | Bokura: The Japanese Indie Game That Traveled Beyond Japan | ~14 min read |
| designed-for-two | Designed for Two: The Co-op Philosophy of Josef Fares | ~13 min read |
| synesthesia-in-video-games | Synesthesia in Video Games | — |
| about-the-japanese-approach-and-what-the-west-can-learn-from-it | About the Japanese Approach… | — |
| interview-series-1-difficulty-vs-approachability | Interview Series 1: Difficulty vs Approachability | — |
| welcome-to-our-gaming-blog | Welcome to Our Gaming Blog | Oldest (2024-06-20) |

Site owners/authors: Vincenzo Catano & Michele Catano. Topic: indie games, game design,
gaming culture.

## Phased plan
- **Phase 0 — Scaffold:** copy Cloudflare/wrangler/analytics skeleton from portfolio repo
  into this repo; adapt names; set up `nav.js`, `footer.js`, `style.css`, `robots.txt`,
  sitemap structure.
- **Phase 1 — Design match:** inspect live Wix CSS (fonts, palette, blog typography);
  build one reusable blog-post template.
- **APPROVAL GATE:** fully style the **Balatro** post (heaviest → stress-tests template).
  Show owner. Get sign-off before mass migration.
- **Phase 2 — Content migration:** remaining 8 posts. Scrape real rendered HTML per post
  (browser tool, not just WebFetch, to keep image placement + captions faithful).
  Download ALL images to local `Assets/`, compress/resize on the way in.
- **Phase 3 — Home + About** pages; wire in the chosen newsletter embed.
- **Phase 4 — SEO parity:** per-page `<title>`, meta description, canonical, Open Graph,
  JSON-LD Article schema, `sitemap.xml`, `robots.txt`. URLs identical to Wix.
- **Phase 5 — Deploy & verify:** Cloudflare preview URL, verify, then owner flips DNS.

## Constraints / risks
1. **Images are the real cost** (~100+ on static.wixstatic.com). Self-host + compress;
   Wix serves them oversized.
2. **Newsletter won't migrate** (Wix backend) → replaced by email-service embed.
3. **"Close but cleaner"**, not pixel-perfect Wix reproduction.
4. **SEO safe if URLs match** — the main host-switch risk is changed URLs. Keep `/post/<slug>`
   and `/about-us` identical, matching sitemap, 301s for edge cases (trailing slash, www/apex).
5. **Dynamic Wix features** (comments, likes, related posts, member login) won't migrate —
   become static or dropped.
6. **Fidelity:** WebFetch loses exact image placement/captions → scrape rendered HTML per post.

## Next step
Start **Phase 0 + Phase 1**, then fully style the **Balatro** post as the first approval
gate. Attach `vincenzo.catano.portfolio` as a secondary working directory to reuse its stack.
