# Dave's Guitars

Website for Dave's Guitars — a guitar repair and luthier shop in the UK. Showcases repair services, custom builds, and lets customers get in touch or request a quote.

## Stack

- [Hono](https://hono.dev) on [Cloudflare Workers](https://workers.cloudflare.com) — edge SSR, sub-100ms pages
- [HTMX](https://htmx.org) — progressive enhancement (all pages work without JS)
- [Tailwind CSS](https://tailwindcss.com) via Play CDN
- Cloudflare KV — blog posts and portfolio index
- Cloudflare R2 — image storage
- [Resend](https://resend.com) — contact form email delivery

## Getting Started

```bash
npm install
npm run dev       # local dev server via wrangler
npm run build     # type-check + dry-run bundle
npm run deploy    # push to Cloudflare Workers
```

## Secrets

Set these once with `wrangler secret put <NAME>`:

| Secret | Description |
|--------|-------------|
| `ADMIN_PASSWORD_HASH` | SHA-256 hex of admin password |
| `SESSION_SECRET` | 32-byte random hex for HMAC session signing |
| `RESEND_API_KEY` | From resend.com dashboard |
| `CONTACT_EMAIL` | Destination address for contact form submissions |

Generate a password hash:

```bash
node -e "const c=require('crypto');process.stdout.write(c.createHash('sha256').update('yourpassword').digest('hex'))"
```

## Project Structure

```
src/
├── index.ts          # App entry point, routes, sitemap, 404
├── types.ts          # Env bindings and shared types
├── routes/           # One file per route group
├── templates/        # HTML layout and shared UI
└── lib/              # KV, auth, markdown, email helpers
public/
├── styles.css
└── htmx.min.js
```

## Admin

Dave manages blog posts and portfolio images at `/admin`. No developer needed for content updates.
