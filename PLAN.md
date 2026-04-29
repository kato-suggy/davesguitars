# Dave's Guitars — Rewrite Plan

> Proposed by Gerard Webb. Planned with Claude Code.

---

## Update — 2026-04-29: Scope Pivot to Minimum Viable Site

After more conversation with Dave, the rewrite scope has been **massively trimmed** for the
first deployable version. Dave is realistic that he won't blog regularly, and won't be
adding portfolio images yet — he just needs occasional small edits to text and prices.

### Current scope (what ships first)

- **Three pages only:** Home, Services, Get a Quote
- **No portfolio, no blog, no admin panel, no images** beyond the static logo
- **Content lives in `content/*.json` in the repo** — Dave edits these via GitHub's web UI
- **Cloudflare auto-deploys on push to `main`** (set up via the Workers dashboard's Git
  integration, or a small `wrangler deploy` GitHub Action)
- **Plain HTML forms** (POST + redirect) — Datastar is loaded but not driving anything yet
- **Google Places reviews feed** stays on the homepage (already wired up)

### Deferred (still in this plan, not abandoned)

These remain on the roadmap for whenever Dave is ready to put the work in — most likely
once the site is live and he has a feel for what he actually wants to manage:

- Drive-backed **blog** (`Phase 2 — step 7`)
- Drive-backed **portfolio** (`Phase 2 — step 7`)
- **Repair estimator** AI feature (`Phase 3 — step 10`)
- **MCP server** (`Phase 3 — step 11`)
- **Bun migration** (`Phase 4 — step 13`)

### Why this pivot is a net win

- Dave learns to edit JSON on GitHub before being asked to manage Docs in Drive — lower
  cognitive cost, and version history is a free side benefit.
- ~1100 lines of admin/auth/KV code deleted; ~70 lines of JSON added.
- The Drive integration's complexity (service account, JWT signing, folder ID config) is
  removed from the critical path to launch.
- Easy to layer Drive in later for blog/portfolio without disturbing the JSON-driven
  pages — they coexist cleanly.

### What stayed from Phase 1 (the design-system foundations)

- Datastar loaded from CDN (placeholder for future use)
- Tailwind CLI build (no Play CDN)
- Design system tokens in `src/styles/tokens.css`
- Self-hosted Arimo + Georgia fonts
- Logo-led header, sentence-case nav, no emoji
- Google Business reviews feed (Places API, 24h Cache API, three latest reviews)

---

## Why Rewrite? (original motivation, preserved)

The original site used HTMX + Cloudflare KV + a custom admin panel. This plan replaces it with
Gerard's preferred stack — a modern, edge-ready architecture that's worth learning and a better
long-term foundation for the site.

The site has **not been deployed yet**, so there's no migration cost or downtime risk.

---

## What Changes

| Concern | Current | Proposed |
|---|---|---|
| Frontend reactivity | HTMX | **Datastar** (SSE-first, signal-driven) |
| Validation | Manual string checks | **Zod** |
| Blog content | Cloudflare KV | **Google Docs** in a Drive folder |
| Portfolio images | Cloudflare R2 | **Google Drive** folder |
| Content management | Custom `/admin` panel | **Google Drive** (no website login needed) |
| AI feature | None | **Guitar repair estimator** (Claude API, streams live) |
| MCP server | None | Exposes shop data as tools for AI agents |
| Styling | Tailwind Play CDN, ad-hoc wood/amber palette | **Tailwind CLI build + design system tokens** (`Dave's Guitars Design System`) |
| Brand voice | Title Case, emoji service icons | First-person singular, sentence case, no emoji |
| Package manager | npm | **Bun** *(deferred to final step — see build order)* |

---

## Design System Integration

A separate **Dave's Guitars Design System** (Claude Design export) is the source of truth for
visual style. The rewrite **applies the design system as it touches each file** rather than
running it as a separate pass — every template that gets rewritten for Datastar/Drive/Zod
also adopts the new tokens, fonts, and voice in the same change.

What the design system gives us:
- **CSS variables** for colors (slate / mint / bone / ink / brass), type scale, spacing,
  radii, shadows, motion (`colors_and_type.css`)
- **Semantic element styles** — `<h1>`, `<p>`, `<blockquote>`, focus rings, links — so
  HTML doesn't need utility-class noise for typography
- **Variable font** Arimo (display/headings), Georgia (body), JetBrains Mono (mono)
- **UI-kit components** (`.dg-*` prefixed) for buttons, chips, header, hero, cards
- **Logo** (slate + mint hexagon badge) — the brand's hero asset; featured prominently
- **Brand voice rules** — first-person singular, no emoji, British English, sentence case

How tokens reach Tailwind:
- CSS variables loaded from `src/styles/tokens.css` at runtime
- `tailwind.config.ts` aliases palette names to those vars (`bg-slate-600` → `var(--slate-600)`)
- Layout utilities (`grid`, `flex`, `max-w-*`, `gap-*`) come from Tailwind
- Typography and colors come from semantic CSS — utilities are *available* but not
  reached for first

Build pipeline (replaces the Play CDN):
- `npm run build:css` — Tailwind CLI watches `src/styles/main.css` → outputs `public/styles.css`
- `npm run dev` — runs `wrangler dev` and `tailwindcss --watch` in parallel
- Worker serves the built CSS via Workers Assets at `/styles.css`

---

## How Dave Manages Content

**No admin panel.** Dave uses Google Drive directly.

### Blog posts
- Dave creates a **Google Doc** in the *Blog Posts* folder
- The document title becomes the post title and URL slug
- The document description (right-click > file info) becomes the excerpt shown in listings
- Moving the Doc into the folder = published. Removing it = unpublished. No buttons, no logins.

### Portfolio images
- Dave **uploads image files** (JPEG/PNG/WebP) to the *Portfolio* folder
- The file description (right-click > file info) becomes the image caption on the site
- Images appear on the site automatically — no upload form needed

### Services & pricing
- These stay in the codebase (they rarely change)
- If pricing changes, a developer updates one file and deploys — takes under 5 minutes

---

## The Guitar Repair Estimator (New Feature)

A new **Estimate Repair** page on the site. Dave's customers:

1. Select their guitar type and repair type from dropdowns
2. Describe the problem in a text box
3. Click **Get Estimate**

The site calls the Claude AI API (Anthropic) and **streams a repair estimate back live** —
the text appears word by word, like a chat interface. The AI is given Dave's full services
and pricing list as context, so estimates are grounded in real figures.

This is a genuinely useful feature for customers who want a rough idea of cost before
getting in touch, and it showcases the site's technical quality.

*Cost: Claude API calls at ~$0.001 per estimate (Haiku model). Negligible for a small shop.*

---

## MCP Server (Technical / AI-Agent Feature)

The site exposes a **Model Context Protocol endpoint** at `/mcp`. This is a standard protocol
that lets AI assistants (Claude Desktop, Cursor, custom agents) query the shop's data programmatically:

- `list_services()` — returns all services with pricing
- `get_pricing("Fretwork")` — returns pricing for a specific service
- `get_contact_info()` — returns how to request a quote

In practice this means: anyone using an AI assistant that supports MCP can ask "what does
Dave charge for a full setup?" and get an accurate answer pulled live from the site.
It's also a learning exercise in the MCP standard.

---

## Cost Breakdown

| Service | Cost |
|---|---|
| Domain (davesguitar.co.uk) | ~£10/year |
| Cloudflare Workers | **Free** (100k requests/day — site won't come close) |
| Google Drive API | **Free** (1 billion calls/day quota — effectively unlimited) |
| Google Cloud (service account) | **Free** |
| Resend (contact form emails) | **Free** (100 emails/day) |
| Claude API (repair estimator) | ~$0.001/estimate — negligible |
| **Total** | **~£10/year + pennies for AI** |

---

## What Dave Needs to Do

1. **Confirm** he's happy managing blog posts and portfolio via Google Drive
2. **Create** a Google Drive folder structure (or let us set it up)
3. **Share** the folders with a service account email we provide
4. Nothing else — no logins, no admin panel, no technical knowledge required

---

## Google Drive Setup (One-Time, Done by Developer)

1. Create a Google Cloud project
2. Enable the Google Drive API
3. Create a *service account* (a bot user that can read Drive files)
4. Share Dave's content folders with the service account email
5. Store the service account credentials as a Cloudflare secret

Dave never touches any of this. Once set up, he just uses Drive as normal.

---

## Tech Stack Summary (for Gerard)

```
Frontend:   Datastar v1.0.0-RC.7  (SSE-first, signal-driven, replaces HTMX)
Backend:    Hono (TypeScript) on Cloudflare Workers
Styling:    Tailwind CLI build + design system tokens (CSS vars)
            Arimo (variable, self-hosted) / Georgia / JetBrains Mono
Validation: Zod + @hono/zod-validator
CMS:        Google Drive API (service account, JWT auth via Web Crypto)
AI:         Anthropic Claude API (@anthropic-ai/sdk) + Hono streamSSE
MCP:        @hono/mcp + @modelcontextprotocol/sdk
Runtime:    Bun (migrated last; npm during initial build)
Deploy:     Cloudflare Workers (free tier; `wrangler dev` locally before deploy)
```

Note on Google Drive + Cloudflare Workers: the `googleapis` npm package is Node.js-only
and incompatible with Workers. The plan uses manual JWT signing via the Workers Web Crypto
API (`crypto.subtle`) — no extra dependencies needed.

---

## Build Order (for Developer Reference)

Status legend: **[done]** = shipped · **[current]** = in flight · **[deferred]** = paused
until Dave needs it.

**Phase 1 — foundations (no Cloudflare account needed; runs in `wrangler dev` locally)**

0. **[done]** Design system intake — `tokens.css`, Arimo fonts, logo in `public/`;
   Tailwind CLI build (replaces Play CDN); tokens wired into `tailwind.config.ts`
1. **[done]** Layout + voice pass — `src/templates/layout.ts` rewritten against the
   design system; HTMX script dropped, Datastar added; logo-led header; sentence-case
   nav; no emoji. (Nav now: Home / What I do / Get a quote.)
2. **[done]** `wrangler.toml` — KV/R2 bindings removed. Drive folder ID vars
   **deferred** (added back when Drive lands).
3. **[done]** `src/types.ts` + helpers — foundation types pruned to `Env` + `Review`.
4. **[done]** Delete dead files — `admin.ts`, `kv.ts`, `auth.ts`, `markdown.ts`,
   `htmx.min.js`, `routes/admin/*`, `routes/blog.ts`, `routes/portfolio.ts`.

**Phase 1.5 — content extraction (added 2026-04-29, current scope)**

4a. **[done]** `content/services.json` + `content/site.json` — all editable copy
    extracted from route files into JSON (Dave edits these on GitHub). `tsconfig`
    gets `resolveJsonModule: true` and `content/**/*.json` in `include`.
4b. **[done]** Routes consume JSON — `home.ts`, `services.ts`, `contact.ts`, and
    `templates/layout.ts` all import from `content/site.json`; `services.ts` reads
    the price table from `content/services.json`.
4c. **[done]** Services page redesign — fancy card grid replaced with a simple
    `<table>` (matches the holding page's design and Dave's preference).
4d. **[done]** Home page simplification — services teaser cards section deleted;
    About Dave moved above reviews using the holding-page text; stat tiles dropped.
4e. **[done]** Contact page direct-contact block — phone / email / Instagram tap
    cards above the form. HTMX wiring stripped in favour of plain POST + redirect
    (Datastar will pick this up later if/when needed).
4f. **[deferred]** GitHub auto-deploy — connect the repo to Cloudflare Workers
    Builds (or add a small `wrangler deploy` GitHub Action). One-time setup before
    Dave can edit JSON on GitHub.

**Phase 2 — content & forms (deferred; needs Drive service account credentials)**

5. **[deferred]** Google Drive setup — parent folder already created
   (`https://drive.google.com/drive/folders/14ylk40a4SQ8NzXRN-1Z3DDyTA31oU9m0`,
   ID `14ylk40a4SQ8NzXRN-1Z3DDyTA31oU9m0`). Remaining: `Blog`/`Portfolio`
   subfolders, GCP project, Drive API enabled, service account, share folder as
   Viewer, store credentials as `GOOGLE_SERVICE_ACCOUNT_JSON` secret,
   `DRIVE_PARENT_FOLDER_ID` in `wrangler.toml` `[vars]`.
6. **[deferred]** `src/lib/drive.ts` — Drive client (manual JWT auth via Web Crypto)
7. **[deferred]** `src/routes/blog.ts` + `src/routes/portfolio.ts` — Drive-backed
8. **[done]** `src/routes/services.ts` + `src/routes/home.ts` — design-system
   restyle done; emoji icons not used (the holding-page-style table doesn't need them).
9. **[deferred]** `src/routes/contact.ts` Zod + Datastar SSE — current
   implementation is plain POST + redirect. Layer Zod and Datastar in when we
   have a reason to (e.g. if validation feedback gets richer than the current
   per-field errors).

9b. **[done]** Google Business reviews feed — `src/lib/reviews.ts` + homepage
    block (above About? — currently below). Places API legacy endpoint, key in
    `GOOGLE_PLACES_API_KEY` secret, `PLACE_ID` in `wrangler.toml` `[vars]`,
    24h Workers Cache API, fallback renders nothing on failure. All as planned.

**Phase 3 — AI features (deferred; needs Anthropic API key)**

10. **[deferred]** `src/routes/estimate.ts` — AI estimator (Claude streaming via Hono SSE)
11. **[deferred]** `src/routes/mcp.ts` — MCP server
12. **[done]** `src/index.ts` — sitemap (3 URLs), robots, custom 404. Re-wire when
    new routes (estimate / mcp / blog / portfolio) come back.

**Phase 4 — tooling and deploy**

13. **[deferred]** Bun migration — npm is fine for the current minimal scope.
    Revisit when adding back Drive / Anthropic SDK / MCP dependencies.
14. **[current]** Cloudflare setup + deploy — `wrangler login`, connect
    `davesguitar.co.uk`, set secrets (`RESEND_API_KEY`, `CONTACT_EMAIL`,
    `GOOGLE_PLACES_API_KEY`), deploy. Then connect repo for GitHub auto-deploy
    (4f above) so Dave can edit JSON without local tooling.

---

## Open Questions

- [ ] Dave: Are you comfortable managing blog posts as Google Docs and portfolio as Drive uploads?
- [x] Dave: Do you already have a Google account / Google Drive? (Can use personal or Workspace)
- [ ] Gerard: Any preference on the Datastar SSE fragment vs signal pattern for the contact form?
- [ ] Gerard: `@hono/mcp` — any gotchas with the Cloudflare Workers adapter?
- [ ] Gerard: Caching strategy for Drive API responses — Cache API in Workers, or KV cache, or just `Cache-Control` headers?
