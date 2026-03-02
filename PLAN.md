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
| Package manager | npm | **Bun** |

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
| Domain (davesguitars.co.uk) | ~£10/year |
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
Validation: Zod + @hono/zod-validator
CMS:        Google Drive API (service account, JWT auth via Web Crypto)
AI:         Anthropic Claude API (@anthropic-ai/sdk) + Hono streamSSE
MCP:        @hono/mcp + @modelcontextprotocol/sdk
Runtime:    Bun
Deploy:     Cloudflare Workers (free tier)
```

Note on Google Drive + Cloudflare Workers: the `googleapis` npm package is Node.js-only
and incompatible with Workers. The plan uses manual JWT signing via the Workers Web Crypto
API (`crypto.subtle`) — no extra dependencies needed.

---

## Build Order (for Developer Reference)

1. Google Drive setup (Cloud Console, service account, folder structure)
2. Bun migration — update `package.json`
3. `wrangler.toml` — remove KV/R2 bindings, add Drive folder ID vars
4. `src/types.ts` + `src/lib/utils.ts` — foundation types and helpers
5. `src/lib/drive.ts` — Drive client (JWT auth + API calls)
6. Delete old files: `admin.ts`, `kv.ts`, `auth.ts`, `markdown.ts`, `htmx.min.js`
7. `src/routes/blog.ts` + `src/routes/portfolio.ts` — Drive-backed
8. `src/templates/layout.ts` — swap HTMX for Datastar, update nav
9. `src/routes/contact.ts` — Zod + Datastar SSE
10. `src/routes/estimate.ts` — AI estimator
11. `src/routes/mcp.ts` — MCP server
12. `src/index.ts` — wire everything, update sitemap/robots
13. Deploy + set secrets

---

## Open Questions

- [ ] Dave: Are you comfortable managing blog posts as Google Docs and portfolio as Drive uploads?
- [x] Dave: Do you already have a Google account / Google Drive? (Can use personal or Workspace)
- [ ] Gerard: Any preference on the Datastar SSE fragment vs signal pattern for the contact form?
- [ ] Gerard: `@hono/mcp` — any gotchas with the Cloudflare Workers adapter?
- [ ] Gerard: Caching strategy for Drive API responses — Cache API in Workers, or KV cache, or just `Cache-Control` headers?
