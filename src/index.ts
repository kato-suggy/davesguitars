import { Hono } from "hono"
import type { Env } from "./types"
import { layout } from "./templates/layout"

import { homeRoute }      from "./routes/home"
import { servicesRoute }  from "./routes/services"
import { portfolioRoute } from "./routes/portfolio"
import { blogRoute }      from "./routes/blog"
import { contactRoute }   from "./routes/contact"
import { adminRoute }     from "./routes/admin"

const app = new Hono<{ Bindings: Env }>()

// Static files in public/ (styles.css, fonts, logo, etc.) are served directly
// by Cloudflare Workers Assets via `[assets] directory = "./public"` in
// wrangler.toml — they never hit this Worker.

// Public image serving from R2
app.get("/images/:filename", async (c) => {
  const filename = c.req.param("filename")
  const obj = await c.env.IMAGES.get(filename)
  if (!obj) return c.notFound()

  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set("cache-control", "public, max-age=31536000, immutable")

  return new Response(obj.body, { headers })
})

// Routes
app.route("/",         homeRoute)
app.route("/services", servicesRoute)
app.route("/portfolio",portfolioRoute)
app.route("/blog",     blogRoute)
app.route("/contact",  contactRoute)
app.route("/admin",    adminRoute)

// Sitemap
app.get("/sitemap.xml", (c) => {
  const base = c.env.SITE_URL
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/services</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/portfolio</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/blog</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${base}/contact</loc><changefreq>yearly</changefreq><priority>0.8</priority></url>
</urlset>`
  return c.text(xml, 200, { "content-type": "application/xml; charset=utf-8" })
})

// robots.txt
app.get("/robots.txt", (c) => {
  return c.text(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${c.env.SITE_URL}/sitemap.xml`)
})

// 404
app.notFound((c) => {
  return c.html(
    layout(/* html */ `
      <section class="max-w-2xl mx-auto px-5 md:px-8 py-20 md:py-32 text-center">
        <p class="eyebrow mb-3" style="color: var(--brass);">404</p>
        <h1>Page not found</h1>
        <p class="lead mx-auto mb-8" style="max-width: 32rem;">
          That page doesn't exist — like a guitar string tuned a fifth too high.
        </p>
        <a href="/" class="inline-flex items-center gap-2 font-display font-semibold text-sm bg-ink hover:bg-slate-800 text-white px-7 py-3 rounded-md no-underline transition-colors">
          Back to home
        </a>
      </section>
    `, { title: "Page not found" }),
    404
  )
})

export default app
