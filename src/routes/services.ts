import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"

export const servicesRoute = new Hono<{ Bindings: Env }>()

type Service = {
  title: string
  description: string
  items: string[]
  priceFrom: string
  turnaround: string
}

const SERVICES: Service[] = [
  {
    title: "Full setup",
    description: "The most important thing you can do for your guitar. A proper setup makes every guitar play better.",
    items: [
      "Truss rod adjustment",
      "Action height at nut and saddle",
      "Intonation setting",
      "Pickup height balancing",
      "Tuning machine check and lube",
      "Fret polish and conditioning",
    ],
    priceFrom: "£50",
    turnaround: "2–4 days",
  },
  {
    title: "Fretwork",
    description: "Uneven frets cause buzzing and dead spots. Proper fretwork restores a smooth, even playing surface.",
    items: [
      "Fret level, crown, and polish",
      "Partial refret (worn sections)",
      "Full refret (all frets replaced)",
      "Stainless steel upgrade option",
      "Nut replacement if needed",
    ],
    priceFrom: "£80",
    turnaround: "3–7 days",
  },
  {
    title: "Electronics",
    description: "From crackly pots to full rewires — clean, quiet electronics make a huge difference.",
    items: [
      "Pickup installation",
      "Control pot and switch replacement",
      "Custom wiring modifications",
      "Jack socket replacement",
      "Cavity shielding (hum reduction)",
      "Preamp installation",
    ],
    priceFrom: "£25",
    turnaround: "1–3 days",
  },
  {
    title: "Structural repairs",
    description: "Accidents happen. Proper repairs with the right glues and techniques can make a guitar stronger than before.",
    items: [
      "Headstock break repair",
      "Cracked top or body repair",
      "Neck reset (acoustic)",
      "Brace regluing",
      "Split seam repair",
    ],
    priceFrom: "£60",
    turnaround: "1–2 weeks",
  },
  {
    title: "Restoration",
    description: "Bringing neglected or vintage instruments back to life, with respect for what makes them special.",
    items: [
      "Full clean and detailing",
      "Hardware cleaning and re-plating",
      "Finish touch-ups and French polish",
      "Tuner replacement",
      "Bridge and nut refabrication",
    ],
    priceFrom: "£100",
    turnaround: "1–3 weeks",
  },
  {
    title: "Custom builds",
    description: "A guitar built specifically for you — your specs, your woods, your sound. From scratch.",
    items: [
      "Design consultation",
      "Wood selection and sourcing",
      "Full construction",
      "Setup and final inspection",
      "Ongoing support",
    ],
    priceFrom: "£800",
    turnaround: "3–6 months",
  },
]

servicesRoute.get("/", (c) => {
  const content = /* html */ `
    <!-- Page header -->
    <section class="bg-ink py-14 md:py-20 text-center">
      <div class="max-w-3xl mx-auto px-5 md:px-8">
        <p class="eyebrow text-mint mb-3">Services &amp; pricing</p>
        <h1 class="text-white">What I do</h1>
        <p class="lead mx-auto" style="color: #d4d8d4; max-width: 36rem;">
          All prices are starting points. I'll give you an exact quote once I've assessed your instrument.
        </p>
      </div>
    </section>

    <!-- Services grid -->
    <section class="max-w-site mx-auto px-5 md:px-8 py-14 md:py-20">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${SERVICES.map(serviceCard).join("")}
      </div>
    </section>

    <!-- Notes -->
    <section class="bg-mint border-y border-mint-deep">
      <div class="max-w-3xl mx-auto px-5 md:px-8 py-12">
        <p class="eyebrow mb-3" style="color: var(--slate-700);">Good to know</p>
        <h2>Honest, no-surprises pricing</h2>
        <ul class="space-y-3 text-slate-700" role="list">
          ${noteItem("All prices are subject to a no-obligation assessment. Complex jobs may cost more — I'll always tell you before I start.")}
          ${noteItem("Parts are charged at cost. I don't mark up components — you pay what I pay.")}
          ${noteItem("I accept guitars by post (tracked, fully insured) or in person by appointment.")}
          ${noteItem("Payment on collection or via bank transfer. 50% deposit required for custom builds.")}
        </ul>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-2xl mx-auto px-5 md:px-8 py-14 md:py-20 text-center">
      <h2>Not sure what your guitar needs?</h2>
      <p class="lead mx-auto mb-7" style="max-width: 32rem;">
        Send me a message and I'll take a look. No commitment required.
      </p>
      <a
        href="/contact"
        class="inline-flex items-center justify-center font-display font-semibold text-sm bg-ink hover:bg-slate-800 text-white px-7 py-3 rounded-md no-underline transition-colors shadow-md"
      >
        Get a free assessment
      </a>
    </section>
  `

  return c.html(layout(content, {
    title: "Services & pricing",
    description: "Guitar repair services including setups, fretwork, electronics, structural repairs, restoration, and custom builds. Starting from £25.",
    canonicalPath: "/services",
  }))
})

function serviceCard(s: Service): string {
  return /* html */ `
  <article class="bg-ivory rounded-lg border border-slate-100 overflow-hidden transition-colors hover:border-slate-300">
    <header class="bg-bone-2 px-6 py-5 border-b border-slate-100">
      <div class="flex items-baseline justify-between gap-4">
        <h2 class="font-display text-xl font-bold text-slate-ink m-0">${s.title}</h2>
        <div class="text-right whitespace-nowrap">
          <p class="eyebrow m-0" style="color: var(--fg-muted);">From</p>
          <p class="font-display font-bold text-xl m-0" style="color: var(--brass);">${s.priceFrom}</p>
        </div>
      </div>
    </header>
    <div class="px-6 py-5">
      <p class="text-sm leading-relaxed mb-4" style="color: var(--fg-muted); max-width: none;">${s.description}</p>
      <ul class="space-y-1.5 mb-4 list-disc list-inside marker:text-brass" role="list">
        ${s.items.map(item => /* html */ `
          <li class="text-sm text-slate-700">${item}</li>
        `).join("")}
      </ul>
      <p class="text-xs mt-4 pt-4 border-t border-slate-100" style="color: var(--fg-subtle);">
        Typical turnaround: <strong style="color: var(--slate-700);">${s.turnaround}</strong>
      </p>
    </div>
  </article>`
}

function noteItem(text: string): string {
  return /* html */ `
  <li class="flex gap-3">
    <span class="mt-1" style="color: var(--brass);" aria-hidden="true">→</span>
    <span>${text}</span>
  </li>`
}
