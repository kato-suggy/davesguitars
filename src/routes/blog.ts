import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"
import { getBlogIndex, getBlogPost } from "../lib/kv"
import { parseMarkdown } from "../lib/markdown"

export const blogRoute = new Hono<{ Bindings: Env }>()

const PAGE_SIZE = 6

// Blog listing
blogRoute.get("/", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10))
  const allPosts = (await getBlogIndex(c.env.BLOG_KV)).filter(p => p.published)
  const total = allPosts.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const posts = allPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const isHtmx = c.req.header("HX-Request") === "true"

  // HTMX "load more" request — return just the card grid fragment
  if (isHtmx && page > 1) {
    return c.html(postCardsFragment(posts, page, totalPages))
  }

  const content = /* html */ `
    <section class="bg-guitar-dark py-16 text-center">
      <div class="max-w-3xl mx-auto px-4">
        <h1 class="font-serif text-4xl md:text-5xl font-bold text-white mb-4">Blog</h1>
        <p class="text-wood-300 text-lg">Guitar tips, repair stories, and luthier notes.</p>
      </div>
    </section>

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      ${total === 0
        ? /* html */ `
          <div class="text-center py-20 text-wood-500">
            <p class="text-5xl mb-4" role="img" aria-label="Guitar">🎸</p>
            <p class="text-lg">No posts yet — check back soon.</p>
          </div>`
        : /* html */ `
          <div id="post-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${posts.map(postCard).join("")}
          </div>
          ${pagination(page, totalPages)}
        `
      }
    </section>
  `

  return c.html(layout(content, {
    title: "Blog",
    description: "Guitar repair tips, setup guides, and luthier notes from Dave's Guitars.",
    canonicalPath: "/blog",
  }))
})

// Individual blog post
blogRoute.get("/:slug", async (c) => {
  const slug = c.req.param("slug")
  const post = await getBlogPost(c.env.BLOG_KV, slug)

  if (!post || !post.published) return c.notFound()

  const htmlContent = parseMarkdown(post.content)
  const date = new Date(post.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })

  const articleJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.createdAt,
    "dateModified": post.updatedAt,
    "author": { "@type": "Person", "name": "Dave" },
    "publisher": { "@type": "Organization", "name": "Dave's Guitars" },
  })

  const content = /* html */ `
    <article class="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <!-- Back link -->
      <a href="/blog" class="inline-flex items-center gap-2 text-wood-500 hover:text-wood-700 text-sm mb-8 transition-colors">
        ← All posts
      </a>

      <header class="mb-10">
        <time datetime="${post.createdAt}" class="text-xs text-wood-400 uppercase tracking-wider">${date}</time>
        <h1 class="font-serif text-3xl md:text-4xl font-bold text-guitar-dark mt-2 mb-4 leading-tight">
          ${escHtml(post.title)}
        </h1>
        ${post.excerpt ? /* html */ `<p class="text-wood-600 text-lg leading-relaxed">${escHtml(post.excerpt)}</p>` : ""}
      </header>

      <!-- Prose content -->
      <div class="prose prose-guitar">
        ${htmlContent}
      </div>

      <style>
        .prose-guitar { color: #3d1f08; line-height: 1.75; }
        .prose-guitar h2 { font-family: Georgia, serif; font-size: 1.5rem; font-weight: 700; margin: 2rem 0 0.75rem; color: #1a0e05; }
        .prose-guitar h3 { font-family: Georgia, serif; font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
        .prose-guitar p  { margin-bottom: 1.25rem; }
        .prose-guitar ul, .prose-guitar ol { margin: 1rem 0 1.25rem 1.5rem; }
        .prose-guitar li { margin-bottom: 0.4rem; }
        .prose-guitar a  { color: #b86615; text-decoration: underline; }
        .prose-guitar a:hover { color: #924d13; }
        .prose-guitar blockquote { border-left: 3px solid #e9bc6d; padding-left: 1rem; color: #6b3a1a; font-style: italic; margin: 1.5rem 0; }
        .prose-guitar code { background: #faefd9; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
        .prose-guitar pre  { background: #1a0e05; color: #f3d9a8; padding: 1rem 1.25rem; border-radius: 8px; overflow-x: auto; margin: 1.5rem 0; }
        .prose-guitar pre code { background: none; padding: 0; }
        .prose-guitar img  { max-width: 100%; border-radius: 8px; margin: 1.5rem 0; }
        .prose-guitar hr  { border: none; border-top: 1px solid #f3d9a8; margin: 2rem 0; }
      </style>

      <footer class="mt-16 pt-8 border-t border-wood-100">
        <a href="/contact" class="inline-block bg-wood-500 hover:bg-wood-600 text-white font-bold px-6 py-3 rounded-lg transition-colors">
          Book a repair →
        </a>
      </footer>
    </article>
  `

  return c.html(layout(content, {
    title: post.title,
    description: post.excerpt || `${post.title} — Dave's Guitars blog`,
    canonicalPath: `/blog/${slug}`,
    head: `<script type="application/ld+json">${articleJsonLd}</script>`,
  }))
})

// ─── Fragments ────────────────────────────────────────────────────────────────

function postCardsFragment(
  posts: ReturnType<typeof getBlogIndex> extends Promise<infer T> ? T : never,
  page: number,
  totalPages: number
): string {
  return posts.map(postCard).join("") + pagination(page, totalPages)
}

function postCard(p: { slug: string; title: string; excerpt: string; createdAt: string }): string {
  const date = new Date(p.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
  return /* html */ `
  <article class="bg-white rounded-xl shadow-sm border border-wood-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
    <div class="p-6 flex-1">
      <time datetime="${p.createdAt}" class="text-xs text-wood-400 uppercase tracking-wide">${date}</time>
      <h2 class="font-serif text-xl font-bold text-guitar-dark mt-2 mb-3 leading-snug">
        <a href="/blog/${p.slug}" class="hover:text-wood-700 transition-colors">${escHtml(p.title)}</a>
      </h2>
      ${p.excerpt ? /* html */ `<p class="text-wood-500 text-sm leading-relaxed line-clamp-3">${escHtml(p.excerpt)}</p>` : ""}
    </div>
    <div class="px-6 pb-5">
      <a href="/blog/${p.slug}" class="text-sm font-medium text-wood-600 hover:text-wood-800 transition-colors">
        Read more →
      </a>
    </div>
  </article>`
}

function pagination(page: number, totalPages: number): string {
  if (totalPages <= 1) return ""
  const nextPage = page + 1
  if (page >= totalPages) return ""

  return /* html */ `
  <div class="mt-10 text-center">
    <button
      class="bg-wood-100 hover:bg-wood-200 text-wood-700 font-medium px-8 py-3 rounded-lg transition-colors"
      hx-get="/blog?page=${nextPage}"
      hx-target="#post-grid"
      hx-swap="beforeend"
      hx-indicator="this"
    >
      Load more posts
    </button>
    <!-- No-JS fallback -->
    <noscript>
      <a href="/blog?page=${nextPage}" class="inline-block bg-wood-100 hover:bg-wood-200 text-wood-700 font-medium px-8 py-3 rounded-lg">
        Next page →
      </a>
    </noscript>
  </div>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
