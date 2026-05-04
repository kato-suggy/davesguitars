# Dave's Guitars

Website for Dave's Guitars — guitar repair and luthier work in North Shields, since 1993.

Three pages: Home, Services, Get a Quote. Plus a Google reviews feed on the homepage and a contact form (Resend) on the quote page.

## Stack

- [Hono](https://hono.dev) on [Cloudflare Workers](https://workers.cloudflare.com) — edge SSR, sub-100ms pages
- [Tailwind CSS](https://tailwindcss.com) — CLI build, design tokens in `src/styles/tokens.css`
- [Resend](https://resend.com) — contact-form email
- Google Places API — homepage reviews feed
- **Content as JSON in the repo** (`content/site.json`, `content/services.json`) — Dave edits these directly via GitHub's web UI; Cloudflare auto-redeploys on push.

No database. No admin panel. No image storage (only the static logo ships).

## Getting Started

```bash
npm install
npm run dev       # wrangler dev + tailwindcss --watch
npm run build     # build CSS + wrangler dry-run (type-check + bundle)
npm run deploy    # build CSS + wrangler deploy
```

## Secrets

Set once with `wrangler secret put <NAME>`:

| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | From the resend.com dashboard |
| `CONTACT_EMAIL` | Where contact-form messages are delivered |
| `GOOGLE_PLACES_API_KEY` | Maps Platform key, restricted to Places API (legacy) — for homepage reviews |

`PLACE_ID` is in `wrangler.toml` `[vars]` (it's a public identifier, not a secret).

## Project Structure

```
content/
├── site.json          # Hero copy, About Dave, contact details, footer blurb
└── services.json      # Service-and-price table

src/
├── index.ts           # Routes, sitemap, robots, 404
├── types.ts           # Env bindings, Review type
├── routes/            # home.ts, services.ts, contact.ts
├── templates/         # layout.ts (shell, nav, footer)
├── styles/            # Tailwind input + design tokens
└── lib/               # email.ts (Resend), reviews.ts (Places)
```

## Editing Content

Dave edits content directly on GitHub:

- **Prices** — `content/services.json`
- **About text, hero copy, contact details, footer** — `content/site.json`

Commit on github.com → Cloudflare redeploys in ~30–60s.

See [CLAUDE.md](./CLAUDE.md) for the full architectural overview.
