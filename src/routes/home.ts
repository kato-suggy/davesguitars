import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"

export const homeRoute = new Hono<{ Bindings: Env }>()

const LOCAL_BUSINESS_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Dave's Guitars",
  "description": "Expert guitar repair, setups, and custom luthier work in the UK.",
  "url": "https://davesguitar.co.uk",
  "priceRange": "££",
  "currenciesAccepted": "GBP",
  "paymentAccepted": "Cash, Bank Transfer",
  "areaServed": "United Kingdom",
})

homeRoute.get("/", (c) => {
  const head = `<script type="application/ld+json">${LOCAL_BUSINESS_JSON_LD}</script>`

  const content = /* html */ `
    <!-- Hero -->
    <section class="relative bg-guitar-dark overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <!-- Subtle wood grain texture via CSS -->
        <div class="w-full h-full" style="background-image: repeating-linear-gradient(
          90deg, transparent, transparent 40px,
          rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px
        );"></div>
      </div>
      <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
        <p class="text-wood-400 text-sm font-semibold uppercase tracking-widest mb-4">
          Luthier &amp; Guitar Repair
        </p>
        <h1 class="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Your Guitar<br class="hidden md:block"> Deserves Expert Hands
        </h1>
        <p class="text-wood-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          From a simple setup to a full custom build — I give every instrument
          the care and attention it deserves.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/contact"
            class="inline-block bg-wood-500 hover:bg-wood-400 text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors shadow-lg"
          >
            Get a Quote
          </a>
          <a
            href="/services"
            class="inline-block border-2 border-wood-400 text-wood-200 hover:bg-guitar-medium font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            View Services
          </a>
        </div>
      </div>
    </section>

    <!-- Services teaser -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h2 class="font-serif text-3xl font-bold text-guitar-dark text-center mb-3">What I Do</h2>
      <p class="text-wood-600 text-center mb-12 max-w-xl mx-auto">
        Every job, big or small, gets the same level of care.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${serviceCard("🔧", "Setups &amp; Action", "Intonation, action height, truss rod adjustment, nut filing — get your guitar playing the way it should.")}
        ${serviceCard("🎸", "Fretwork", "Fret levelling, crowning, polishing, and full refrets. Breathing life back into worn necks.")}
        ${serviceCard("⚡", "Electronics", "Pickup swaps, wiring mods, shielding, jack replacements. Hum-free tone.")}
        ${serviceCard("🪵", "Custom Builds", "One-off instruments designed and built around you. Your vision, my craft.")}
        ${serviceCard("🔩", "Structural Repairs", "Broken headstocks, cracked tops, neck resets. Expert gluing and clamping.")}
        ${serviceCard("✨", "Restoration", "Bringing vintage instruments back to playable condition — with respect for originality.")}
      </div>

      <div class="text-center mt-10">
        <a href="/services" class="text-wood-600 hover:text-wood-800 font-medium underline underline-offset-4 transition-colors">
          Full services &amp; pricing →
        </a>
      </div>
    </section>

    <!-- Trust / about strip -->
    <section class="bg-wood-100 border-y border-wood-200">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:flex md:items-center md:gap-12">
        <div class="md:flex-1 mb-8 md:mb-0">
          <h2 class="font-serif text-3xl font-bold text-guitar-dark mb-4">About Dave</h2>
          <p class="text-wood-700 leading-relaxed mb-4">
            I've been repairing and building guitars for over 15 years. Whether it's a
            beat-up pawn shop find or a prized vintage instrument, I treat every guitar
            like it matters — because it does.
          </p>
          <p class="text-wood-700 leading-relaxed mb-6">
            Based in the UK, I take commissions from players across the country. Turnaround
            times are honest, communication is clear, and the work speaks for itself.
          </p>
          <a href="/portfolio" class="inline-block text-wood-600 hover:text-wood-800 font-medium underline underline-offset-4 transition-colors">
            See my portfolio →
          </a>
        </div>
        <aside class="md:flex-1 grid grid-cols-3 gap-4 text-center">
          ${statBlock("15+", "Years experience")}
          ${statBlock("500+", "Guitars repaired")}
          ${statBlock("UK", "Nationwide service")}
        </aside>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
      <h2 class="font-serif text-3xl font-bold text-guitar-dark mb-4">Ready to get started?</h2>
      <p class="text-wood-600 mb-8">
        Tell me about your guitar and what it needs. I'll get back to you within 24 hours.
      </p>
      <a
        href="/contact"
        class="inline-block bg-wood-500 hover:bg-wood-600 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors shadow-md"
      >
        Request a Quote
      </a>
    </section>
  `

  return c.html(layout(content, {
    title: "Dave's Guitars",
    description: "Expert guitar repair, setups, and custom luthier work. Based in the UK — serving players nationwide.",
    canonicalPath: "/",
    head,
  }))
})

function serviceCard(icon: string, title: string, desc: string): string {
  return /* html */ `
  <article class="bg-white rounded-xl p-6 shadow-sm border border-wood-100 hover:shadow-md transition-shadow">
    <div class="text-3xl mb-3" role="img" aria-hidden="true">${icon}</div>
    <h3 class="font-serif font-bold text-guitar-dark text-lg mb-2">${title}</h3>
    <p class="text-wood-600 text-sm leading-relaxed">${desc}</p>
  </article>`
}

function statBlock(value: string, label: string): string {
  return /* html */ `
  <div class="bg-white rounded-xl p-4 shadow-sm">
    <p class="font-serif text-3xl font-bold text-wood-600">${value}</p>
    <p class="text-xs text-wood-500 mt-1">${label}</p>
  </div>`
}
