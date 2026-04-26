import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"

export const homeRoute = new Hono<{ Bindings: Env }>()

const LOCAL_BUSINESS_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Dave's Guitars",
  "description": "Expert guitar repair, setups, and custom luthier work in the UK. Since 1993.",
  "url": "https://davesguitar.co.uk",
  "image": "https://davesguitar.co.uk/assets/logo-square.png",
  "priceRange": "££",
  "currenciesAccepted": "GBP",
  "paymentAccepted": "Cash, Bank Transfer",
  "areaServed": "United Kingdom",
  "foundingDate": "1993",
})

homeRoute.get("/", (c) => {
  const head = `<script type="application/ld+json">${LOCAL_BUSINESS_JSON_LD}</script>`

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
        <p class="eyebrow text-mint mb-6">Luthier &amp; guitar repair</p>

        <img
          src="/assets/logo.png"
          alt="Dave's Guitars logo"
          class="mx-auto block mb-8"
          style="height: clamp(160px, 28vw, 240px); width: auto;"
          width="240"
          height="240"
        >

        <h1 class="text-white max-w-2xl mx-auto">Your guitar deserves expert hands</h1>

        <p class="lead mx-auto mb-8" style="color: #d4d8d4; max-width: 36rem;">
          From a simple setup to a full custom build — I give every instrument
          the care and attention it deserves.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          ${primaryButton("/contact", "Get a quote")}
          ${ghostLightButton("/services", "What I do")}
        </div>
      </div>
    </section>

    <!-- Services teaser -->
    <section class="max-w-site mx-auto px-5 md:px-8 py-14 md:py-20">
      <div class="text-center mb-10 md:mb-12">
        <p class="eyebrow mb-3">What I do</p>
        <h2>Repair, setup, build</h2>
        <p class="lead mx-auto" style="max-width: 34rem;">
          Every job, big or small, gets the same level of care.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${serviceCard("Setups &amp; action",   "Intonation, action height, truss-rod adjustment, nut filing — get your guitar playing the way it should.")}
        ${serviceCard("Fretwork",              "Fret levelling, crowning, polishing, and full refrets. Breathing life back into worn necks.")}
        ${serviceCard("Electronics",           "Pickup swaps, wiring mods, shielding, jack replacements. Hum-free tone.")}
        ${serviceCard("Custom builds",         "One-off instruments designed and built around you. Your vision, my craft.")}
        ${serviceCard("Structural repairs",    "Broken headstocks, cracked tops, neck resets. Expert gluing and clamping.")}
        ${serviceCard("Restoration",           "Bringing vintage instruments back to playable condition — with respect for originality.")}
      </div>

      <div class="text-center mt-10">
        <a href="/services" class="font-display font-medium text-sm">
          Full services &amp; pricing →
        </a>
      </div>
    </section>

    <!-- About / trust strip — mint accent panel (used once per page) -->
    <section class="bg-mint">
      <div class="max-w-site mx-auto px-5 md:px-8 py-14 md:py-20 md:flex md:items-center md:gap-12">
        <div class="md:flex-1 mb-8 md:mb-0">
          <p class="eyebrow mb-3" style="color: var(--slate-600);">About Dave</p>
          <h2 style="color: var(--slate-ink);">Built and repaired since 1993</h2>
          <p style="color: var(--slate-ink);">
            I've been repairing and building guitars for over 30 years. Whether it's a
            beat-up pawn shop find or a prized vintage instrument, I treat every guitar
            like it matters — because it does.
          </p>
          <p style="color: var(--slate-ink);">
            Based in the UK, I take commissions from players across the country. Turnaround
            times are honest, communication is clear, and the work speaks for itself.
          </p>
          <a href="/portfolio" class="font-display font-medium text-sm" style="color: var(--slate-ink);">
            See my portfolio →
          </a>
        </div>

        <aside class="md:flex-1 grid grid-cols-3 gap-3" aria-label="Workshop stats">
          ${statBlock("30+",   "Years")}
          ${statBlock("500+",  "Repairs")}
          ${statBlock("UK",    "Nationwide")}
        </aside>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="max-w-2xl mx-auto px-5 md:px-8 py-14 md:py-20 text-center">
      <h2>Ready to get started?</h2>
      <p class="lead mx-auto mb-7" style="max-width: 32rem;">
        Tell me about your guitar and what it needs. I'll respond within 24 hours.
      </p>
      ${primaryButton("/contact", "Request a quote")}
    </section>
  `

  return c.html(layout(content, {
    title: "Dave's Guitars",
    description: "Expert guitar repair, setups, and custom luthier work. Based in the UK — serving players nationwide. Since 1993.",
    canonicalPath: "/",
    head,
  }))
})

/* ------------------------------------------------------------------ helpers */

function serviceCard(title: string, desc: string): string {
  return /* html */ `
  <article class="bg-ivory rounded-lg p-5 border border-slate-100 transition-colors hover:border-slate-200">
    <h3 class="text-xl mb-2" style="margin-bottom: var(--space-2);">${title}</h3>
    <p class="text-sm" style="color: var(--fg-muted); margin-bottom: 0;">${desc}</p>
  </article>`
}

function statBlock(value: string, label: string): string {
  return /* html */ `
  <div class="bg-ivory rounded-md p-4 text-center border border-mint-deep">
    <p class="font-display font-bold text-3xl" style="color: var(--slate-ink); margin-bottom: 2px;">${value}</p>
    <p class="eyebrow" style="color: var(--slate-600);">${label}</p>
  </div>`
}

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
