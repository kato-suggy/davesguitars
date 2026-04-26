import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"
import { getPortfolioImages } from "../lib/kv"

export const portfolioRoute = new Hono<{ Bindings: Env }>()

portfolioRoute.get("/", async (c) => {
  const images = await getPortfolioImages(c.env.BLOG_KV)

  const content = /* html */ `
    <section class="bg-ink py-14 md:py-20 text-center">
      <div class="max-w-3xl mx-auto px-5 md:px-8">
        <p class="eyebrow text-mint mb-3">Portfolio</p>
        <h1 class="text-white">Recent work</h1>
        <p class="lead mx-auto" style="color: #d4d8d4; max-width: 36rem;">
          A selection of repairs, builds, and restorations.
        </p>
      </div>
    </section>

    <section class="max-w-site mx-auto px-5 md:px-8 py-14 md:py-20">
      ${images.length === 0
        ? /* html */ `
          <div class="text-center py-20" style="color: var(--fg-muted);">
            <p class="lead">Portfolio coming soon.</p>
            <p class="text-sm mt-2" style="margin-bottom: 0;">
              <a href="/contact">Get in touch</a> to discuss your project.
            </p>
          </div>`
        : /* html */ `
          <div class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            ${images.map(imageCard).join("")}
          </div>`
      }
    </section>

    <section class="max-w-2xl mx-auto px-5 md:px-8 pb-20 text-center">
      <p class="text-sm mb-6" style="color: var(--fg-muted);">
        Interested in having similar work done on your guitar?
      </p>
      <a
        href="/contact"
        class="inline-flex items-center gap-2 font-display font-semibold text-sm bg-ink hover:bg-slate-800 text-white px-7 py-3 rounded-md no-underline transition-colors"
      >
        Request a quote
      </a>
    </section>
  `

  return c.html(layout(content, {
    title: "Portfolio",
    description: "Gallery of guitar repairs, custom builds, and restorations by Dave's Guitars.",
    canonicalPath: "/portfolio",
  }))
})

function imageCard(img: { filename: string; alt: string; caption: string }): string {
  return /* html */ `
  <figure class="break-inside-avoid mb-4 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-ivory">
    <img
      src="/images/${encodeURIComponent(img.filename)}"
      alt="${escHtml(img.alt)}"
      loading="lazy"
      decoding="async"
      class="w-full object-cover"
    >
    ${img.caption ? /* html */ `
      <figcaption class="px-4 py-3 text-sm text-slate-600 leading-relaxed">
        ${escHtml(img.caption)}
      </figcaption>
    ` : ""}
  </figure>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
