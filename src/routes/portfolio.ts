import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"
import { getPortfolioImages } from "../lib/kv"

export const portfolioRoute = new Hono<{ Bindings: Env }>()

portfolioRoute.get("/", async (c) => {
  const images = await getPortfolioImages(c.env.BLOG_KV)

  const content = /* html */ `
    <section class="bg-guitar-dark py-16 text-center">
      <div class="max-w-3xl mx-auto px-4">
        <h1 class="font-serif text-4xl md:text-5xl font-bold text-white mb-4">Portfolio</h1>
        <p class="text-wood-300 text-lg">A selection of repairs, builds, and restorations.</p>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      ${images.length === 0
        ? /* html */ `
          <div class="text-center py-20 text-wood-500">
            <p class="text-5xl mb-4" role="img" aria-label="Guitar">🪵</p>
            <p class="text-lg">Portfolio coming soon.</p>
            <p class="text-sm mt-2">
              <a href="/contact" class="underline text-wood-600 hover:text-wood-800">Get in touch</a> to discuss your project.
            </p>
          </div>`
        : /* html */ `
          <div class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            ${images.map(imageCard).join("")}
          </div>`
      }
    </section>

    <section class="max-w-2xl mx-auto px-4 pb-20 text-center">
      <p class="text-wood-500 text-sm mb-6">
        Interested in having similar work done on your guitar?
      </p>
      <a
        href="/contact"
        class="inline-block bg-wood-500 hover:bg-wood-600 text-white font-bold px-8 py-3 rounded-lg transition-colors"
      >
        Request a Quote
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
  <figure class="break-inside-avoid mb-4 rounded-xl overflow-hidden shadow-sm border border-wood-100 bg-white">
    <img
      src="/images/${encodeURIComponent(img.filename)}"
      alt="${escHtml(img.alt)}"
      loading="lazy"
      decoding="async"
      class="w-full object-cover"
    >
    ${img.caption ? /* html */ `
      <figcaption class="px-4 py-3 text-sm text-wood-600 leading-relaxed">
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
