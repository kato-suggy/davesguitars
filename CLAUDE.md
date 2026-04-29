# Dave's Guitars

## Project Overview

Website for Dave's Guitars — a guitar repair and luthier shop based in North Shields. The site explains what Dave does, lists prices, and gives customers ways to get in touch (form, phone, email, Instagram).

**Scope (deliberate):** three pages — Home, Services, Get a Quote. No blog, no portfolio, no admin panel. Content (text + prices) is edited by Dave directly on GitHub by editing JSON files in `content/`; Cloudflare auto-deploys on push to `main`. Images are out of scope until Dave is ready to add them — only the static logo ships.

## Tech Stack

- **Framework:** Hono (TypeScript) on Cloudflare Workers
- **Interactivity:** Plain HTML forms (POST + redirect). Datastar is loaded from CDN as a placeholder for future progressive enhancement; nothing on the site currently depends on it.
- **Styling:** Tailwind CSS (CLI build → `public/styles.css`) + design tokens in `src/styles/tokens.css`
- **Content:** JSON files in `content/`, imported at build time (no runtime DB)
- **Email:** Resend API (contact form)
- **Reviews:** Google Places API (homepage reviews feed)
- **Hosting:** Cloudflare Workers — free tier (~£10/yr domain only)

## Development Commands

```bash
npm install          # hono + tailwindcss + wrangler
npm run dev          # wrangler dev + tailwind --watch (concurrently)
npm run build        # build CSS + wrangler dry-run (type check + bundle)
npm run deploy       # build CSS + wrangler deploy
```

## Project Structure

```
content/
├── site.json             # All editable copy: hero text, About Dave,
│                         # contact details (phone/email/insta/address),
│                         # footer blurb. Edited by Dave on GitHub.
└── services.json         # Price table: [{ service, price }]

src/
├── index.ts              # Hono app entry, mounts routes + sitemap + 404
├── types.ts              # Env bindings, Review type
├── routes/
│   ├── home.ts           # GET /
│   ├── services.ts       # GET /services
│   └── contact.ts        # GET + POST /contact (form + direct-contact block)
├── templates/
│   └── layout.ts         # HTML shell, nav, footer (reads site.json contact)
├── styles/
│   └── (Tailwind input + design tokens)
└── lib/
    ├── email.ts          # Resend API wrapper (contact form)
    └── reviews.ts        # Google Places API wrapper (homepage reviews)

public/
├── styles.css            # Built by Tailwind CLI (gitignored)
├── assets/               # Logo + favicon
└── fonts/                # Self-hosted display + body fonts
```

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Homepage — hero, About Dave, Google reviews, CTA |
| GET | `/services` | Services & pricing table (from `content/services.json`) |
| GET/POST | `/contact` | Quote form + phone/email/insta direct-contact block |
| GET | `/sitemap.xml` | Sitemap (3 URLs) |
| GET | `/robots.txt` | Robots policy |

## Secrets (set via `wrangler secret put`)

| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | From resend.com — sends contact-form emails |
| `CONTACT_EMAIL` | Dave's email address (recipient for the form) |
| `GOOGLE_PLACES_API_KEY` | Maps Platform key, restricted to Places API (legacy) — for the reviews feed |

`PLACE_ID` is in `wrangler.toml` `[vars]` (it's a public identifier, not a secret).

## Content Editing (Dave's workflow)

Dave edits content by going to the repo on github.com:

- **Prices:** edit `content/services.json` — add/remove rows, change prices.
- **About Dave / hero copy / footer blurb:** edit `content/site.json`.
- **Contact details (phone, email, Instagram, address):** edit the `contact` block in `content/site.json`.

Save (commit) on GitHub → Cloudflare auto-redeploys in ~30–60s.

## Site Goals

- Explain what Dave does and what it costs
- Make it easy to get in touch (form OR phone/email/DM)
- Establish credibility — verifiable specifics (City of Leeds, JG Windows, PMT) over round-number stats
- Dave can update text and prices himself, no developer needed

## Success Criteria

- Sub-100ms page loads (Cloudflare edge SSR)
- Works without JavaScript (forms are plain POST + redirect)
- Dave can change text and prices via GitHub web UI alone
- Under £20/year (~£10 domain only, everything else free tier)
- Perfect Lighthouse scores (SSR, minimal JS, semantic HTML)

## Code Conventions

- HTML strings tagged with `/* html */` template-literal comments (editor highlighting)
- `escHtml()` helper for any user-supplied data (currently only review text from the Places API)
- Content from `content/*.json` is treated as developer-controlled (build-time, not user input) and interpolated raw — keep HTML-special chars out of JSON values
- Templates are plain TS functions returning strings (no JSX)
- Commit messages: imperative, concise (e.g. "Bump setup price to £60")
