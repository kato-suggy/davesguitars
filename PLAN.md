# Dave's Guitars — Rewrite Plan

> Proposed by Gerard Webb. Planned with Claude Code. Not yet implemented.

---

## Why Rewrite?

The current site uses HTMX + Cloudflare KV + a custom admin panel. This plan replaces it with
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

**Phase 1 — foundations (no Cloudflare account needed; runs in `wrangler dev` locally)**

0. **Design system intake** — drop `colors_and_type.css`, `Arimo` fonts, and `logo.png`
   into `public/`; set up Tailwind CLI build (replaces Play CDN); wire tokens into
   `tailwind.config.ts`
1. **Layout + voice pass** — rewrite `src/templates/layout.ts` against the design system;
   drop HTMX script, add Datastar; logo-led header; sentence-case nav; no emoji
2. **`wrangler.toml`** — remove KV/R2 bindings, add Drive folder ID vars
3. **`src/types.ts`** + **`src/lib/utils.ts`** — foundation types and helpers
4. **Delete dead files**: `admin.ts`, `kv.ts`, `auth.ts`, `markdown.ts`, `htmx.min.js`,
   `routes/admin/*`

**Phase 2 — content & forms (still local; needs Drive service account credentials)**

5. **Google Drive setup** (Cloud Console, service account, folder structure) —
   ★ user has created the parent Drive folder
   (`https://drive.google.com/drive/folders/14ylk40a4SQ8NzXRN-1Z3DDyTA31oU9m0`,
   ID `14ylk40a4SQ8NzXRN-1Z3DDyTA31oU9m0`).
   Remaining: create `Blog` and `Portfolio` subfolders inside it, set up GCP project,
   enable Drive API, create service account, share parent folder (or each subfolder)
   with the service-account email as Viewer, download credentials JSON,
   store as `GOOGLE_SERVICE_ACCOUNT_JSON` secret. Folder ID goes into `wrangler.toml`
   `[vars]` as `DRIVE_PARENT_FOLDER_ID` (not a secret — just a pointer).
6. **`src/lib/drive.ts`** — Drive client (manual JWT auth via Web Crypto + API calls)
7. **`src/routes/blog.ts`** + **`src/routes/portfolio.ts`** — Drive-backed (apply design system)
8. **`src/routes/services.ts`** + **`src/routes/home.ts`** — restyle to design system,
   drop emoji service icons (use Lucide via CDN at stroke-width 1.75)
9. **`src/routes/contact.ts`** — Zod + Datastar SSE (apply design system)

9b. **Google Business reviews feed** — `src/lib/reviews.ts` + homepage trust strip
    - **API:** Google **Places API (legacy)** → Place Details endpoint
      `https://maps.googleapis.com/maps/api/place/details/json` with
      `?fields=reviews,rating,user_ratings_total` (returns up to 5 most-relevant
      reviews). Limit fields to keep us in the cheaper "Atmosphere" SKU and
      avoid Contact Data charges. Simpler than the (now-restricted) Business
      Profile API. Free tier covers small-volume use.
    - **Auth:** Maps Platform API key (separate from Drive service account).
      Store as `GOOGLE_PLACES_API_KEY` secret.
    - **Identifier:** Dave's Google Business *Place ID* in `wrangler.toml`
      `[vars]` as `PLACE_ID = "ChIJmVPVDflufkgRuAgB93v-5Bw"` (not a secret — public identifier).
    - **Caching:** Cloudflare Workers Cache API, `cache-control: max-age=86400`
      (24h). Reviews don't change often and Places quota is per-day.
    - **Display (per design system):** 3 most recent, star row + first 2 lines +
      reviewer initials. Sentence-case "Recent reviews" header, not "Testimonials".
    - **Fallback:** if API call fails, render nothing (no skeleton, no error) —
      the section just doesn't appear.

**Phase 3 — AI features (still local; needs Anthropic API key)**

10. **`src/routes/estimate.ts`** — AI estimator (Claude streaming via Hono SSE)
11. **`src/routes/mcp.ts`** — MCP server
12. **`src/index.ts`** — wire everything, update sitemap/robots, custom 404

**Phase 4 — tooling and deploy**

13. **Bun migration** — update `package.json`, replace npm scripts, lock-file swap.
    Done last so any breakage is isolated to package-manager changes, not bundled
    with framework/CSS work.
14. **Cloudflare setup + deploy** — `wrangler login`, connect domain, set secrets
    (`wrangler secret put RESEND_API_KEY` / `ANTHROPIC_API_KEY` / Drive creds), deploy.

---

## Open Questions

- [ ] Dave: Are you comfortable managing blog posts as Google Docs and portfolio as Drive uploads?
- [x] Dave: Do you already have a Google account / Google Drive? (Can use personal or Workspace)
- [ ] Gerard: Any preference on the Datastar SSE fragment vs signal pattern for the contact form?
- [ ] Gerard: `@hono/mcp` — any gotchas with the Cloudflare Workers adapter?
- [ ] Gerard: Caching strategy for Drive API responses — Cache API in Workers, or KV cache, or just `Cache-Control` headers?
