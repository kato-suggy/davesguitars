# Dave's Guitars

## Project Overview

Website for Dave's Guitars — a guitar repair and luthier shop. The site showcases repair services, custom builds, and provides a way for customers to get in touch or book work.

## Tech Stack

- **Framework:** Hono (TypeScript) on Cloudflare Workers
- **Interactivity:** HTMX (progressive enhancement — all pages work without JS)
- **Styling:** Tailwind CSS via Play CDN (plan: purge to static CSS in v2)
- **Storage:** Cloudflare KV (blog posts, portfolio index) + R2 (images)
- **Email:** Resend API
- **Hosting:** Cloudflare Workers — free tier (~£10/yr domain only)

## Development Commands

```bash
npm install          # Install dependencies (includes wrangler, hono, marked)
npm run dev          # wrangler dev — local dev server
npm run build        # dry-run build (type check + bundle)
npm run deploy       # wrangler deploy — push to Cloudflare
```

## Project Structure

```
src/
├── index.ts              # Hono app entry, mounts all routes + sitemap + 404
├── types.ts              # Env bindings, BlogPost, PortfolioImage types
├── routes/
│   ├── home.ts           # GET /
│   ├── services.ts       # GET /services
│   ├── portfolio.ts      # GET /portfolio
│   ├── blog.ts           # GET /blog, GET /blog/:slug
│   ├── contact.ts        # GET + POST /contact
│   └── admin.ts          # /admin/* — login, dashboard, CRUD
├── templates/
│   └── layout.ts         # HTML shell, nav, footer, Tailwind config, HTMX
└── lib/
    ├── kv.ts             # KV helpers (blog posts, portfolio index)
    ├── auth.ts           # HMAC session cookies
    ├── markdown.ts       # marked.js wrapper + light sanitiser
    └── email.ts          # Resend API wrapper
public/
├── styles.css            # Minimal base styles (Tailwind handles the rest)
└── htmx.min.js           # HTMX — served from Workers Assets
```

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Homepage |
| GET | `/services` | Services & pricing |
| GET | `/portfolio` | Photo grid (R2 images) |
| GET | `/blog` | Blog list (KV, paginated) |
| GET | `/blog/:slug` | Blog post (markdown → HTML) |
| GET/POST | `/contact` | Quote request form (Resend email) |
| GET | `/admin` | Redirects to login or dashboard |
| GET/POST | `/admin/login` | Admin login (SHA-256 password + HMAC session) |
| GET | `/admin/dashboard` | Post list + portfolio thumbs |
| GET/POST | `/admin/posts/new` | Create post |
| GET/POST | `/admin/posts/:slug/edit` | Edit post |
| DELETE | `/admin/posts/:slug` | Delete post (HTMX) |
| POST | `/admin/preview` | Markdown → HTML preview (HTMX) |
| GET/POST | `/admin/portfolio/upload` | Upload image to R2 |
| POST | `/admin/portfolio/:filename/delete` | Delete image |

## Secrets (set via `wrangler secret put`)

| Secret | Description |
|--------|-------------|
| `ADMIN_PASSWORD_HASH` | SHA-256 hex of Dave's admin password |
| `SESSION_SECRET` | 32-byte random hex for HMAC signing |
| `RESEND_API_KEY` | From resend.com |
| `CONTACT_EMAIL` | Dave's email address |

Generate password hash:
```bash
node -e "const c=require('crypto');process.stdout.write(c.createHash('sha256').update('yourpassword').digest('hex'))"
```

## KV Data Format

- `posts:index` → `BlogIndexEntry[]` (sorted newest first)
- `post:{slug}` → `BlogPost` (full post with markdown content)
- `portfolio:index` → `PortfolioImage[]` (sorted newest first)

## Site Goals

- Showcase repair and luthier services
- Allow customers to contact Dave or request a quote
- Display past work / portfolio of builds and repairs
- Establish credibility and local presence
- Dave can manage blog and portfolio from `/admin` without developer help

## Success Criteria

- Sub-100ms page loads (Cloudflare edge SSR)
- Works without JavaScript (all forms are plain POST, HTMX is enhancement)
- Dave can add content independently via `/admin`
- Under £20/year (~£10 domain only, everything else free tier)
- Perfect Lighthouse scores (SSR, minimal JS, semantic HTML)

## Code Conventions

- HTML strings with `/* html */` template literal comments (for editor syntax highlighting)
- `escHtml()` helper used wherever user/external data is interpolated into HTML
- All templates are plain TypeScript functions returning strings (no JSX)
- HTMX interactions always have a no-JS `<noscript>` or query-param fallback
- Commit messages: imperative mood, concise (e.g. "Add contact form")
