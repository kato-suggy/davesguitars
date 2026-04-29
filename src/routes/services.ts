import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"
import site from "../../content/site.json"
import services from "../../content/services.json"

export const servicesRoute = new Hono<{ Bindings: Env }>()

servicesRoute.get("/", (c) => {
  const { hero } = site.services

  const content = /* html */ `
    <!-- Page header -->
    <section class="bg-ink py-14 md:py-20 text-center">
      <div class="max-w-3xl mx-auto px-5 md:px-8">
        <p class="eyebrow text-mint mb-3">${hero.eyebrow}</p>
        <h1 class="text-white">${hero.heading}</h1>
        <p class="lead mx-auto" style="color: #d4d8d4; max-width: 36rem;">
          ${hero.lead}
        </p>
      </div>
    </section>

    <!-- Pricing table -->
    <section class="max-w-3xl mx-auto px-5 md:px-8 py-14 md:py-20">
      <table class="w-full bg-ivory rounded-lg overflow-hidden border border-slate-100">
        <caption class="sr-only">Services and starting prices</caption>
        <thead class="bg-bone-2 text-left">
          <tr>
            <th scope="col" class="font-display font-semibold text-sm px-5 py-3 text-slate-ink">Service</th>
            <th scope="col" class="font-display font-semibold text-sm px-5 py-3 text-right text-slate-ink whitespace-nowrap">Price</th>
          </tr>
        </thead>
        <tbody>
          ${services.map(serviceRow).join("")}
        </tbody>
      </table>

      <p class="text-xs text-center mt-6" style="color: var(--fg-subtle);">
        Parts charged at cost. Complex jobs may cost more — I'll always tell you before I start.
      </p>
    </section>

    <!-- CTA -->
    <section class="max-w-2xl mx-auto px-5 md:px-8 pb-14 md:pb-20 text-center">
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
    description: "Guitar repair services and pricing — setups, fretwork, electronics, refrets, refinishes, and more. Starting from £10.",
    canonicalPath: "/services",
  }))
})

function serviceRow(s: { service: string; price: string }): string {
  return /* html */ `
  <tr class="border-t border-slate-100">
    <td class="px-5 py-3 text-sm text-slate-ink">${s.service}</td>
    <td class="px-5 py-3 text-sm text-right whitespace-nowrap font-display font-semibold" style="color: var(--brass);">${s.price}</td>
  </tr>`
}
