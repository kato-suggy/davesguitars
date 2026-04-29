import { Hono } from "hono"
import type { Env, Review } from "../types"
import { layout } from "../templates/layout"
import { fetchReviews } from "../lib/reviews"
import site from "../../content/site.json"

export const homeRoute = new Hono<{ Bindings: Env }>()

const LOCAL_BUSINESS_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Dave's Guitars",
  "description": "Stringed instrument repair and luthier work in North Shields. Since 1993.",
  "url": "https://davesguitar.co.uk",
  "image": "https://davesguitar.co.uk/assets/logo-square.png",
  "telephone": site.contact.phoneTel,
  "email": site.contact.email,
  "priceRange": "££",
  "currenciesAccepted": "GBP",
  "paymentAccepted": "Cash, Bank Transfer",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": site.contact.addressLocality,
    "addressRegion":   site.contact.addressRegion,
    "postalCode":      site.contact.postcode,
    "addressCountry":  site.contact.country,
  },
  "areaServed": "United Kingdom",
  "foundingDate": "1993",
  "sameAs": [site.contact.instagramUrl],
})

homeRoute.get("/", async (c) => {
  const head = `<script type="application/ld+json">${LOCAL_BUSINESS_JSON_LD}</script>`

  // Reviews section is hidden entirely if the API call fails or no reviews
  // come back — the design system says broken trust signals damage credibility
  // more than missing ones.
  const reviews = await fetchReviews(c.env.PLACE_ID, c.env.GOOGLE_PLACES_API_KEY)

  const { hero, about, finalCta } = site.home

  const content = /* html */ `
    <!-- Hero — logo-led, on ink -->
    <section class="relative overflow-hidden bg-ink text-center">
      <!-- Subtle vertical-stripe grain (amp tolex) -->
      <div
        class="absolute inset-0 pointer-events-none"
        style="background-image: repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.015) 40px 41px);"
        aria-hidden="true"
      ></div>

      <div class="relative max-w-3xl mx-auto px-5 md:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
        <p class="eyebrow text-mint mb-6">${hero.eyebrow}</p>

        <img
          src="/assets/logo.png"
          alt="Dave's Guitars logo"
          class="mx-auto block mb-8"
          style="height: clamp(160px, 28vw, 240px); width: auto;"
          width="240"
          height="240"
        >

        <h1 class="text-white max-w-2xl mx-auto">${hero.heading}</h1>

        <p class="lead mx-auto mb-8" style="color: #d4d8d4; max-width: 36rem;">
          ${hero.lead}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          ${primaryButton("/contact", "Get a quote")}
          ${ghostLightButton("/services", "What I do")}
        </div>
      </div>
    </section>

    <!-- About Dave — mint accent panel (used once per page) -->
    <section class="bg-mint">
      <div class="max-w-3xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <p class="eyebrow mb-3" style="color: var(--slate-600);">${about.eyebrow}</p>
        <h2 style="color: var(--slate-ink);">${about.heading}</h2>
        ${about.paragraphs.map(p => /* html */ `
          <p style="color: var(--slate-ink);">${p}</p>
        `).join("")}
        <p class="mt-6">
          <a href="/services" class="font-display font-medium text-sm" style="color: var(--slate-ink);">
            See what I do →
          </a>
        </p>
      </div>
    </section>

    ${reviews.length > 0 ? reviewsSection(reviews) : ""}

    <!-- Final CTA -->
    <section class="max-w-2xl mx-auto px-5 md:px-8 py-14 md:py-20 text-center">
      <h2>${finalCta.heading}</h2>
      <p class="lead mx-auto mb-7" style="max-width: 32rem;">
        ${finalCta.lead}
      </p>
      ${primaryButton("/contact", "Request a quote")}
    </section>
  `

  return c.html(layout(content, {
    title: "Dave's Guitars",
    description: "Stringed instrument repair and luthier work in North Shields. Professional work at sensible prices, since 1993.",
    canonicalPath: "/",
    head,
  }))
})

/* ------------------------------------------------------------------ helpers */

function primaryButton(href: string, label: string): string {
  return /* html */ `<a
    href="${href}"
    class="inline-flex items-center justify-center gap-2 font-display font-semibold text-sm bg-ivory text-ink px-7 py-3 rounded-md no-underline transition-colors hover:bg-mint"
  >${label}</a>`
}

function ghostLightButton(href: string, label: string): string {
  return /* html */ `<a
    href="${href}"
    class="inline-flex items-center justify-center gap-2 font-display font-semibold text-sm text-mint border border-mint/30 px-7 py-3 rounded-md no-underline transition-colors hover:bg-mint/10 hover:border-mint"
  >${label}</a>`
}

function reviewsSection(reviews: Review[]): string {
  return /* html */ `
    <!-- Recent Google reviews -->
    <section class="max-w-site mx-auto px-5 md:px-8 py-14 md:py-20">
      <div class="text-center mb-10 md:mb-12">
        <p class="eyebrow mb-3">Recent reviews</p>
        <h2>What people say</h2>
        <p class="lead mx-auto" style="max-width: 32rem;">
          Real reviews from Google — never fabricated, never edited.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        ${reviews.map(reviewCard).join("")}
      </div>
    </section>
  `
}

function reviewCard(r: Review): string {
  return /* html */ `
  <article class="bg-ivory rounded-lg border border-slate-100 p-6 flex flex-col">
    <p
      class="font-display text-lg mb-3"
      style="color: var(--brass); letter-spacing: 0.08em;"
      role="img"
      aria-label="${r.rating} out of 5 stars"
    >
      <span aria-hidden="true">${"★".repeat(r.rating)}<span style="color: var(--slate-200);">${"★".repeat(5 - r.rating)}</span></span>
    </p>

    <p
      class="line-clamp-2 italic mb-5 flex-1"
      style="color: var(--slate-700); font-family: var(--font-body); line-height: 1.55; max-width: none;"
    >${escHtml(r.text)}</p>

    <footer class="flex items-center gap-3 mt-auto">
      <span
        class="inline-flex items-center justify-center font-display font-semibold text-sm"
        style="width: 36px; height: 36px; border-radius: 999px; background: var(--mint); color: var(--slate-ink); border: 1px solid var(--mint-deep);"
        aria-hidden="true"
      >${escHtml(r.authorInitials)}</span>
      <div>
        <p class="font-display font-medium text-sm" style="color: var(--slate-ink); margin: 0; max-width: none;">${escHtml(r.authorName)}</p>
        ${r.relativeTime ? /* html */ `<p class="text-xs" style="color: var(--fg-subtle); margin: 0;">${escHtml(r.relativeTime)}</p>` : ""}
      </div>
    </footer>
  </article>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
