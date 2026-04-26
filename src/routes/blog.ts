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
    <section class="bg-ink py-14 md:py-20 text-center">
      <div class="max-w-3xl mx-auto px-5 md:px-8">
        <p class="eyebrow text-mint mb-3">Journal</p>
        <h1 class="text-white">Notes from the bench</h1>
        <p class="lead mx-auto" style="color: #d4d8d4; max-width: 36rem;">
          Guitar tips, repair stories, and luthier notes.
        </p>
      </div>
    </section>

    <section class="max-w-site mx-auto px-5 md:px-8 py-14 md:py-20">
      ${total === 0
        ? /* html */ `
          <div class="text-center py-20" style="color: var(--fg-muted);">
            <p class="lead mx-auto">No posts yet — check back soon.</p>
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
      <a href="/blog" class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-8 transition-colors">
        ← All posts
      </a>

      <header class="mb-10">
        <time datetime="${post.createdAt}" class="text-xs text-slate-400 uppercase tracking-wider">${date}</time>
        <h1 class="font-display text-3xl md:text-4xl font-bold text-slate-ink mt-2 mb-4 leading-tight">
          ${escHtml(post.title)}
        </h1>
        ${post.excerpt ? /* html */ `<p class="text-slate-600 text-lg leading-relaxed">${escHtml(post.excerpt)}</p>` : ""}
      </header>

      <!-- Prose content — element styles come from src/styles/tokens.css -->
      <div class="prose-body">
        ${htmlContent}
      </div>

      <style>
        .prose-body ul, .prose-body ol { margin: var(--space-4) 0 var(--space-5) var(--space-5); }
        .prose-body li  { margin-bottom: var(--space-2); }
        .prose-body img { max-width: 100%; border-radius: var(--radius-md); margin: var(--space-6) 0; display: block; }
        .prose-body h2  { margin-top: var(--space-7); }
        .prose-body h3  { margin-top: var(--space-6); }
      </style>

      <footer class="mt-16 pt-8 border-t border-slate-100">
        <a href="/contact" class="inline-flex items-center gap-2 font-display font-semibold text-sm bg-ink hover:bg-slate-800 text-white px-7 py-3 rounded-md no-underline transition-colors">
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
  <article class="bg-ivory rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
    <div class="p-6 flex-1">
      <time datetime="${p.createdAt}" class="text-xs text-slate-400 uppercase tracking-wide">${date}</time>
      <h2 class="font-display text-xl font-bold text-slate-ink mt-2 mb-3 leading-snug">
        <a href="/blog/${p.slug}" class="hover:text-slate-700 transition-colors">${escHtml(p.title)}</a>
      </h2>
      ${p.excerpt ? /* html */ `<p class="text-slate-500 text-sm leading-relaxed line-clamp-3">${escHtml(p.excerpt)}</p>` : ""}
    </div>
    <div class="px-6 pb-5">
      <a href="/blog/${p.slug}" class="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
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
      class="bg-bone-2 hover:bg-mint-deep text-slate-700 font-medium px-8 py-3 rounded-lg transition-colors"
      hx-get="/blog?page=${nextPage}"
      hx-target="#post-grid"
      hx-swap="beforeend"
      hx-indicator="this"
    >
      Load more posts
    </button>
    <!-- No-JS fallback -->
    <noscript>
      <a href="/blog?page=${nextPage}" class="inline-block bg-bone-2 hover:bg-mint-deep text-slate-700 font-medium px-8 py-3 rounded-lg">
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
