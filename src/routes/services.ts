import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"

export const servicesRoute = new Hono<{ Bindings: Env }>()

type Service = {
  icon: string
  title: string
  description: string
  items: string[]
  priceFrom: string
  turnaround: string
}

const SERVICES: Service[] = [
  {
    icon: "🔧",
    title: "Full Setup",
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
    icon: "🪜",
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
    icon: "⚡",
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
    icon: "🔩",
    title: "Structural Repairs",
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
    icon: "✨",
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
    icon: "🪵",
    title: "Custom Builds",
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
    <section class="bg-guitar-dark py-16 text-center">
      <div class="max-w-3xl mx-auto px-4">
        <h1 class="font-serif text-4xl md:text-5xl font-bold text-white mb-4">Services &amp; Pricing</h1>
        <p class="text-wood-300 text-lg">
          All prices are starting points. I'll give you an exact quote once I've assessed your instrument.
        </p>
      </div>
    </section>

    <!-- Services grid -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        ${SERVICES.map(serviceCard).join("")}
      </div>
    </section>

    <!-- Notes -->
    <section class="bg-wood-100 border-y border-wood-200">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h2 class="font-serif text-2xl font-bold text-guitar-dark mb-6">Good to Know</h2>
        <ul class="space-y-3 text-wood-700">
          <li class="flex gap-3">
            <span class="text-wood-400 mt-1" aria-hidden="true">→</span>
            <span>All prices are subject to a no-obligation assessment. Complex jobs may cost more — I'll always tell you before I start.</span>
          </li>
          <li class="flex gap-3">
            <span class="text-wood-400 mt-1" aria-hidden="true">→</span>
            <span>Parts are charged at cost. I don't mark up components — you pay what I pay.</span>
          </li>
          <li class="flex gap-3">
            <span class="text-wood-400 mt-1" aria-hidden="true">→</span>
            <span>I accept guitars by post (tracked, fully insured) or in person by appointment.</span>
          </li>
          <li class="flex gap-3">
            <span class="text-wood-400 mt-1" aria-hidden="true">→</span>
            <span>Payment on collection or via bank transfer. 50% deposit required for custom builds.</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-2xl mx-auto px-4 py-20 text-center">
      <h2 class="font-serif text-3xl font-bold text-guitar-dark mb-4">Not sure what your guitar needs?</h2>
      <p class="text-wood-600 mb-8">Send me a message and I'll take a look. No commitment required.</p>
      <a
        href="/contact"
        class="inline-block bg-wood-500 hover:bg-wood-600 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors shadow-md"
      >
        Get a Free Assessment
      </a>
    </section>
  `

  return c.html(layout(content, {
    title: "Services & Pricing",
    description: "Guitar repair services including setups, fretwork, electronics, structural repairs, restoration, and custom builds. Starting from £25.",
    canonicalPath: "/services",
  }))
})

function serviceCard(s: Service): string {
  return /* html */ `
  <article class="bg-white rounded-xl shadow-sm border border-wood-100 overflow-hidden hover:shadow-md transition-shadow">
    <div class="bg-wood-50 px-6 py-5 border-b border-wood-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-3xl" role="img" aria-hidden="true">${s.icon}</span>
          <h2 class="font-serif text-xl font-bold text-guitar-dark">${s.title}</h2>
        </div>
        <div class="text-right">
          <p class="text-xs text-wood-500 uppercase tracking-wide">From</p>
          <p class="font-bold text-wood-600 text-xl">${s.priceFrom}</p>
        </div>
      </div>
    </div>
    <div class="px-6 py-5">
      <p class="text-wood-600 text-sm mb-4 leading-relaxed">${s.description}</p>
      <ul class="space-y-1.5 mb-4">
        ${s.items.map(item => /* html */ `
          <li class="flex items-start gap-2 text-sm text-wood-700">
            <span class="text-wood-400 mt-0.5" aria-hidden="true">✓</span>
            ${item}
          </li>
        `).join("")}
      </ul>
      <p class="text-xs text-wood-400 mt-4 pt-4 border-t border-wood-100">
        Typical turnaround: <strong class="text-wood-600">${s.turnaround}</strong>
      </p>
    </div>
  </article>`
}
