import { Hono } from "hono"
import { serveStatic } from "hono/cloudflare-workers"
import type { Env } from "./types"
import { layout } from "./templates/layout"

import { homeRoute }      from "./routes/home"
import { servicesRoute }  from "./routes/services"
import { portfolioRoute } from "./routes/portfolio"
import { blogRoute }      from "./routes/blog"
import { contactRoute }   from "./routes/contact"
import { adminRoute }     from "./routes/admin"

const app = new Hono<{ Bindings: Env }>()

// Static assets (htmx.min.js, styles.css via Workers Assets)
app.use("/htmx.min.js", serveStatic({ path: "./htmx.min.js" }))
app.use("/styles.css",  serveStatic({ path: "./styles.css" }))

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
      <section class="max-w-2xl mx-auto px-4 py-32 text-center">
        <h1 class="font-serif text-5xl font-bold text-guitar-dark mb-4">404</h1>
        <p class="text-wood-600 mb-8">That page doesn't exist — like a guitar string tuned a fifth too high.</p>
        <a href="/" class="inline-block bg-wood-500 hover:bg-wood-600 text-white font-semibold px-6 py-3 rounded transition-colors">
          Back to Home
        </a>
      </section>
    `, { title: "Page Not Found" }),
    404
  )
})

export default app
