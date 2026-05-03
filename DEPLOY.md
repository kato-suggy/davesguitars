# Deploy Runbook

Operational guide for taking the site from "code on `main`" to "live on
`davesguitar.co.uk`". Follow in order — most steps depend on the one before.

For project context, see [README.md](README.md), [CLAUDE.md](CLAUDE.md),
and [PLAN.md](PLAN.md).

---

## Current State (2026-04-30)

- Code is merged to `main` on origin (latest commit: `a90eb6c`).
- `.dev.vars` is set up in this checkout's worktree, with real
  `GOOGLE_PLACES_API_KEY`, `RESEND_API_KEY`, and `CONTACT_EMAIL`.
- Site is **not yet deployed**. `davesguitar.co.uk` still points to Wix.
- Three Cloudflare-side things are required before first deploy: domain on
  Cloudflare DNS, Worker custom domain, production secrets. They have to
  happen in roughly that order.
- Resend can't send from `davesguitar.co.uk` until the sending domain is
  verified, which itself depends on Cloudflare-managed DNS.

---

## Pre-flight Check

Before starting, verify:

```bash
# From the main checkout
cd /Users/kato/Repos/davesguitars
git checkout main
git pull
git log --oneline -3
# Top commit should be: a90eb6c Update README and plan for trimmed scope
```

If `a90eb6c` isn't on top, the merge from earlier didn't make it to origin.
Re-run `git push` from main before continuing.

Also confirm wrangler is logged in:

```bash
wrangler whoami
# Should show your Cloudflare account email. If not: wrangler login
```

---

## Step 1 · Inventory what Wix is doing for the domain

**Why this matters:** when nameservers move to Cloudflare, anything Wix was
quietly handling (most importantly email) goes dark unless the records get
recreated on Cloudflare first. This is the single most common way a domain
migration breaks something users care about.

What to check:

- **Mail (MX records).** Does `dave@davesguitar.co.uk` actually receive
  mail? If yes, what's the receiving service (Wix Mail / Google Workspace /
  forwarding)? Find this in the Wix dashboard under Domains → DNS, or run
  `dig MX davesguitar.co.uk +short` from a terminal to see what's currently
  resolving.
- **Subdomains.** `www`, any others? Most likely just `@` and `www`.
- **TXT / SPF / DMARC.** Anti-spam records. If there's an SPF record now,
  it has to be replicated, or outgoing mail from any service that uses
  `@davesguitar.co.uk` will fail spam checks.
- **Holding page.** It's fine to lose this.

Write down everything `dig` returns:

```bash
dig davesguitar.co.uk ANY +noall +answer
dig MX davesguitar.co.uk +short
dig TXT davesguitar.co.uk +short
dig www.davesguitar.co.uk +short
```

Keep this output handy — it's your reference when reconciling Cloudflare's
DNS import in Step 2.

---

## Step 2 · Add the domain to Cloudflare

In the Cloudflare dashboard:

1. **Add Site** → enter `davesguitar.co.uk` → **Free** plan.
2. Cloudflare scans existing public DNS and proposes an import.
3. **Reconcile against your Step 1 dig output.** Anything Cloudflare didn't
   import that needs to keep working — add manually now. Pay particular
   attention to MX (mail) and TXT (SPF) records.
4. Cloudflare gives you two nameservers, e.g. `xxx.ns.cloudflare.com`,
   `yyy.ns.cloudflare.com`. Copy these — you need them for Step 3.

**Do not click "Check nameservers" yet.** That's done after Step 3.

---

## Step 3 · Switch nameservers at the registrar

Where this happens depends on who Dave's domain is *registered* with —
which may or may not be Wix. Wix sometimes acts as both registrar and
host; sometimes only as a DNS host while the registrar is GoDaddy / 123Reg
/ etc. Check the Wix dashboard's domain page; it'll say which.

At the registrar:

1. Find the nameserver settings for `davesguitar.co.uk`.
2. Replace the existing nameservers with the two Cloudflare ones from Step 2.
3. Save.

Propagation: usually 5–30 min, occasionally up to 24h. The Wix holding page
keeps serving until propagation completes (your local DNS may still be
cached).

Verify with:

```bash
dig NS davesguitar.co.uk +short
# When it shows the two Cloudflare nameservers, you're done.
```

Cloudflare emails you when it detects the switch and marks the domain
**Active**.

---

## Step 4 · Provision the Worker custom domain

Once the domain shows **Active** in Cloudflare:

1. Workers & Pages → `davesguitars` worker → **Settings** → **Domains & Routes**.
2. **Add Custom Domain** → `davesguitar.co.uk`. Cloudflare creates the
   DNS record and provisions an SSL certificate automatically (~1 min).
3. Repeat for `www.davesguitar.co.uk` (recommend this so visitors typing
   `www.` don't get an error).

Test: `curl -I https://davesguitar.co.uk` should return a 200 — but you
won't see the new site yet because no Worker code has been deployed.
That's Step 7.

---

## Step 5 · Set production secrets

The same values that are in your local `.dev.vars`, but stored in
Cloudflare's edge encrypted storage:

```bash
cd /Users/kato/Repos/davesguitars   # main checkout, on main branch
wrangler secret put GOOGLE_PLACES_API_KEY
# Paste the value from .dev.vars when prompted
wrangler secret put CONTACT_EMAIL
# Paste: dave@davesguitar.co.uk
```

**Hold off on `RESEND_API_KEY`** — Step 6 depends on the sending domain
being verified, and the API key won't actually deliver mail until that's
done. You can set it now if you want; it just won't work yet.

Verify:

```bash
wrangler secret list
# Should show the names (not values) of all secrets you've set.
```

---

## Step 6 · Verify the Resend sending domain

Resend won't deliver from `davesguitar.co.uk` until you prove ownership.

1. Resend dashboard → **Domains** → **Add Domain** → `davesguitar.co.uk`.
2. Resend gives you DKIM records (and recommends DMARC). Three or four
   `CNAME` / `TXT` entries.
3. Add each to **Cloudflare DNS** (`davesguitar.co.uk` zone → DNS →
   Records → Add record). Use the exact name and value Resend gives you.
4. Back in Resend, click **Verify**. Should succeed within 5 minutes
   (DNS propagation through Cloudflare is fast).
5. Once verified, set the production secret:

```bash
wrangler secret put RESEND_API_KEY
```

If you ever change Dave's *sender address* (e.g. switch from
`onboarding@resend.dev` to `noreply@davesguitar.co.uk`), update
`src/lib/email.ts` accordingly — but for now the existing wiring is fine.

---

## Step 7 · First deploy

```bash
cd /Users/kato/Repos/davesguitars
git checkout main
git pull   # belt-and-braces; ensures you're at a90eb6c
npm install   # ensures node_modules matches lockfile
npm run deploy
```

You should see wrangler upload the bundle and report a deploy URL.
Visit `https://davesguitar.co.uk` — should be the new site.

If you see Cloudflare's default placeholder, the custom domain from
Step 4 didn't bind to the worker — re-check that step.

---

## Step 8 · Wire up GitHub auto-deploy

So Dave's edits to `content/*.json` go live without you running `wrangler`.

In the Worker dashboard:

1. **Settings** → **Builds** → **Connect to Git**.
2. Repository: `kato-suggy/davesguitars`.
3. Production branch: `main`.
4. Build command: `npm run build:css`
5. Deploy command: `npx wrangler deploy`
6. Save.

Test it works:

```bash
# From any local checkout
echo "" >> README.md   # trivial change
git add README.md
git commit -m "Trigger auto-deploy test"
git push
```

Watch the Cloudflare Worker's **Deployments** tab — within ~30s you
should see a new deployment from the GitHub commit. Then revert:

```bash
git revert HEAD --no-edit
git push
```

Confirm a *second* auto-deploy fires for the revert.

---

## Step 9 · Smoke test on the live site

Click through every page on the production URL:

- **`/`**
  - Hero renders with logo + headline + lead + two buttons.
  - About Dave panel shows the holding-page text ("Hi, I'm Dave…").
  - Reviews section appears (assuming Places API key works).
  - Final CTA renders.
  - View source: JSON-LD has the real address (NE29 6SL), phone, Instagram.
- **`/services`**
  - All 16 rows present with correct prices.
  - `<table>` is responsive (try on phone width).
- **`/contact`**
  - Direct-contact block (mint panel) renders with three clickable cards.
  - Tap phone card on a real phone — opens dialer with `+447716344663`.
  - Tap email card — opens mail composer with `dave@davesguitar.co.uk`.
  - Tap Instagram card — opens `instagram.com/davewasp`.
  - Submit the form with valid data — Dave receives the email.
  - Submit with empty fields — validation errors appear.
- **Footer (every page)**
  - Phone, email, Instagram all clickable.
  - Address line shows "North Shields, Tyne and Wear · NE29 6SL".
- **`/sitemap.xml`** and **`/robots.txt`** return 200.
- **Random URL** like `/foo` returns the custom 404 page.

Lighthouse: open Chrome DevTools → Lighthouse → run. Should score 100
(or close) on Performance / Accessibility / SEO. Best Practices may dock
a point for the Datastar CDN script (cross-origin); that's fine.

---

## Step 10 · Tweaks pass

With the live site as ground truth, do small text/styling adjustments.

**Content changes:** edit `content/site.json` or `content/services.json`,
commit, push. Auto-deploy ships in ~30s.

**Visual / structural changes:** edit templates or `src/styles/tokens.css`,
test locally with `npm run dev`, commit, push.

Keep commits small and descriptive — Dave (and future-you) will read this
log.

---

## Step 11 · Handover to Dave

Once you're happy with the live site:

1. Make sure Dave has a GitHub account and add him as a **collaborator** on
   `kato-suggy/davesguitars` (Settings → Collaborators → Add).
2. Walk him through editing `content/services.json`:
   - Open the repo on github.com.
   - Click `content/services.json`.
   - Click the pencil icon (top right of the file view).
   - Change a price, e.g. £60 → £65.
   - Scroll down, type a commit message ("Bump setup price to £65").
   - Click **Commit changes**.
   - Wait ~30s and refresh the live site.
3. Have him do this once with you watching. Most stumbling blocks are at
   the "find the pencil" / "what's the green button" step, not at the
   editing itself.
4. Show him `content/site.json` for everything else (about text, hero
   copy, contact details, footer blurb).
5. Send him the live URL and the GitHub repo URL. That's the handover.

---

## Rollback Plan (if something breaks during deploy)

- **Bad deploy went live:** in Cloudflare Workers → Deployments tab, every
  past deploy is listed. Click ⋯ → **Rollback** to revert in seconds. No
  git or rebuild needed.
- **DNS broke email:** revert nameservers at the registrar to whatever Wix
  was using. Propagation 5–30 min. Mail flow returns.
- **Resend API key leaked:** in Resend dashboard, revoke the key; in
  Cloudflare run `wrangler secret put RESEND_API_KEY` with a new value.
  No deploy needed — secret update propagates immediately.

---

## Reference

- Repo: https://github.com/kato-suggy/davesguitars
- Cloudflare account: (whichever you logged into with `wrangler login`)
- Domain registrar: TBD — check Wix dashboard
- Resend: https://resend.com
- Place ID for reviews: `ChIJmVPVDflufkgRuAgB93v-5Bw` (in `wrangler.toml`)
