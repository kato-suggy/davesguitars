import { Hono } from "hono"
import type { Env, BlogPost } from "../types"
import { layout } from "../templates/layout"
import {
  verifyPassword, createSessionToken, verifySessionToken,
  getSessionCookie, makeSessionCookieHeader, clearSessionCookieHeader,
} from "../lib/auth"
import {
  getBlogIndex, getBlogPost, saveBlogPost, deleteBlogPost,
  getPortfolioImages, addPortfolioImage, deletePortfolioImage, slugify,
} from "../lib/kv"
import { parseMarkdown } from "../lib/markdown"

export const adminRoute = new Hono<{ Bindings: Env }>()

// ─── Auth guard helper ────────────────────────────────────────────────────────

async function isAuthed(req: Request, secret: string): Promise<boolean> {
  const cookie = getSessionCookie(req.headers.get("cookie"))
  if (!cookie) return false
  return verifySessionToken(cookie, secret)
}

// ─── Redirect root /admin ─────────────────────────────────────────────────────

adminRoute.get("/", async (c) => {
  if (await isAuthed(c.req.raw, c.env.SESSION_SECRET)) {
    return c.redirect("/admin/dashboard")
  }
  return c.redirect("/admin/login")
})

// ─── Login ────────────────────────────────────────────────────────────────────

adminRoute.get("/login", async (c) => {
  if (await isAuthed(c.req.raw, c.env.SESSION_SECRET)) {
    return c.redirect("/admin/dashboard")
  }
  return c.html(layout(loginPage(), {
    title: "Admin Login",
    description: "Admin area",
    canonicalPath: "/admin/login",
  }))
})

adminRoute.post("/login", async (c) => {
  const form = await c.req.formData()
  const password = (form.get("password") as string ?? "").trim()

  const valid = await verifyPassword(password, c.env.ADMIN_PASSWORD_HASH)
  if (!valid) {
    return c.html(layout(loginPage("Incorrect password."), {
      title: "Admin Login",
      description: "Admin area",
      canonicalPath: "/admin/login",
    }), 401)
  }

  const token = await createSessionToken(c.env.SESSION_SECRET)
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin/dashboard",
      "Set-Cookie": makeSessionCookieHeader(token),
    },
  })
})

adminRoute.post("/logout", (c) => {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin/login",
      "Set-Cookie": clearSessionCookieHeader(),
    },
  })
})

// ─── Guard all /admin/* routes below ─────────────────────────────────────────

adminRoute.use("/*", async (c, next) => {
  if (!(await isAuthed(c.req.raw, c.env.SESSION_SECRET))) {
    return c.redirect("/admin/login")
  }
  return next()
})

// ─── Dashboard ────────────────────────────────────────────────────────────────

adminRoute.get("/dashboard", async (c) => {
  const posts  = await getBlogIndex(c.env.BLOG_KV)
  const images = await getPortfolioImages(c.env.BLOG_KV)

  const content = /* html */ `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div class="flex items-center justify-between mb-8">
        <h1 class="font-serif text-3xl font-bold text-guitar-dark">Admin Dashboard</h1>
        <form method="POST" action="/admin/logout">
          <button type="submit" class="text-sm text-wood-500 hover:text-wood-700 underline">Log out</button>
        </form>
      </div>

      <!-- Blog section -->
      <section class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-serif text-xl font-bold text-guitar-dark">Blog Posts</h2>
          <a href="/admin/posts/new" class="bg-wood-500 hover:bg-wood-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New Post
          </a>
        </div>

        ${posts.length === 0
          ? /* html */ `<p class="text-wood-400 text-sm">No posts yet.</p>`
          : /* html */ `
            <div class="bg-white rounded-xl border border-wood-100 overflow-hidden shadow-sm">
              <table class="w-full text-sm">
                <thead class="bg-wood-50 border-b border-wood-100">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-wood-700">Title</th>
                    <th class="text-left px-4 py-3 font-semibold text-wood-700 hidden sm:table-cell">Date</th>
                    <th class="text-left px-4 py-3 font-semibold text-wood-700">Status</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody id="posts-table">
                  ${posts.map(postRow).join("")}
                </tbody>
              </table>
            </div>`
        }
      </section>

      <!-- Portfolio section -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-serif text-xl font-bold text-guitar-dark">Portfolio Images</h2>
          <a href="/admin/portfolio/upload" class="bg-wood-500 hover:bg-wood-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + Upload Image
          </a>
        </div>

        ${images.length === 0
          ? /* html */ `<p class="text-wood-400 text-sm">No images yet.</p>`
          : /* html */ `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" id="portfolio-grid">
              ${images.map(imageThumb).join("")}
            </div>`
        }
      </section>
    </div>
  `

  return c.html(layout(content, { title: "Dashboard", description: "Admin", canonicalPath: "/admin/dashboard" }))
})

// ─── Blog CRUD ────────────────────────────────────────────────────────────────

adminRoute.get("/posts/new", (c) => {
  return c.html(layout(postEditor(null), { title: "New Post", description: "Admin", canonicalPath: "/admin/posts/new" }))
})

adminRoute.post("/posts", async (c) => {
  const form = await c.req.formData()
  const title   = (form.get("title")   as string ?? "").trim()
  const excerpt = (form.get("excerpt") as string ?? "").trim()
  const content = (form.get("content") as string ?? "").trim()
  const published = form.get("published") === "on"

  if (!title || !content) {
    const post = { title, excerpt, content, published } as Partial<BlogPost>
    return c.html(layout(postEditor(null, post, "Title and content are required."), {
      title: "New Post", description: "Admin", canonicalPath: "/admin/posts/new",
    }), 400)
  }

  const now = new Date().toISOString()
  const slug = slugify(title)

  const post: BlogPost = {
    slug, title, excerpt, content, published,
    createdAt: now, updatedAt: now,
  }

  await saveBlogPost(c.env.BLOG_KV, post)
  return c.redirect("/admin/dashboard")
})

adminRoute.get("/posts/:slug/edit", async (c) => {
  const slug = c.req.param("slug")
  const post = await getBlogPost(c.env.BLOG_KV, slug)
  if (!post) return c.notFound()

  return c.html(layout(postEditor(post), { title: "Edit Post", description: "Admin", canonicalPath: `/admin/posts/${slug}/edit` }))
})

adminRoute.post("/posts/:slug", async (c) => {
  const slug = c.req.param("slug")
  const existing = await getBlogPost(c.env.BLOG_KV, slug)
  if (!existing) return c.notFound()

  const form = await c.req.formData()
  const method  = (form.get("_method") as string ?? "").toUpperCase()

  // Handle DELETE via POST+_method override (no-JS fallback)
  if (method === "DELETE") {
    await deleteBlogPost(c.env.BLOG_KV, slug)
    return c.redirect("/admin/dashboard")
  }

  const title   = (form.get("title")   as string ?? "").trim()
  const excerpt = (form.get("excerpt") as string ?? "").trim()
  const content = (form.get("content") as string ?? "").trim()
  const published = form.get("published") === "on"

  if (!title || !content) {
    return c.html(layout(postEditor(existing, { title, excerpt, content, published }, "Title and content are required."), {
      title: "Edit Post", description: "Admin", canonicalPath: `/admin/posts/${slug}/edit`,
    }), 400)
  }

  const updated: BlogPost = {
    ...existing, title, excerpt, content, published,
    updatedAt: new Date().toISOString(),
  }
  await saveBlogPost(c.env.BLOG_KV, updated)
  return c.redirect("/admin/dashboard")
})

// HTMX DELETE
adminRoute.delete("/posts/:slug", async (c) => {
  const slug = c.req.param("slug")
  await deleteBlogPost(c.env.BLOG_KV, slug)
  // Return empty response — HTMX will remove the row
  return c.body(null, 200)
})

// Admin: live markdown preview endpoint
adminRoute.post("/preview", async (c) => {
  const form = await c.req.formData()
  const md = (form.get("content") as string ?? "")
  const html = parseMarkdown(md)
  return c.html(/* html */ `<div class="prose-guitar">${html}</div>`)
})

// ─── Portfolio image upload ───────────────────────────────────────────────────

adminRoute.get("/portfolio/upload", (c) => {
  return c.html(layout(uploadPage(), { title: "Upload Image", description: "Admin", canonicalPath: "/admin/portfolio/upload" }))
})

adminRoute.post("/portfolio/upload", async (c) => {
  const form = await c.req.formData()
  const file    = form.get("image") as File | null
  const alt     = (form.get("alt")     as string ?? "").trim()
  const caption = (form.get("caption") as string ?? "").trim()

  if (!file || file.size === 0) {
    return c.html(layout(uploadPage("Please select an image file."), {
      title: "Upload Image", description: "Admin", canonicalPath: "/admin/portfolio/upload",
    }), 400)
  }

  // Sanitise filename
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const allowed = ["jpg", "jpeg", "png", "webp", "gif"]
  if (!allowed.includes(ext)) {
    return c.html(layout(uploadPage("Only JPG, PNG, WebP, or GIF images are allowed."), {
      title: "Upload Image", description: "Admin", canonicalPath: "/admin/portfolio/upload",
    }), 400)
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  await c.env.IMAGES.put(filename, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  await addPortfolioImage(c.env.BLOG_KV, {
    filename, alt, caption,
    uploadedAt: new Date().toISOString(),
  })

  return c.redirect("/admin/dashboard")
})

adminRoute.post("/portfolio/:filename/delete", async (c) => {
  const filename = c.req.param("filename")
  await c.env.IMAGES.delete(filename)
  await deletePortfolioImage(c.env.BLOG_KV, filename)

  // HTMX: return empty to remove element; non-HTMX: redirect
  if (c.req.header("HX-Request") === "true") {
    return c.body(null, 200)
  }
  return c.redirect("/admin/dashboard")
})

// ─── Templates ───────────────────────────────────────────────────────────────

function loginPage(error?: string): string {
  return /* html */ `
  <div class="min-h-screen bg-wood-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-lg border border-wood-100 w-full max-w-sm p-8">
      <h1 class="font-serif text-2xl font-bold text-guitar-dark mb-2 text-center">Dave's Guitars</h1>
      <p class="text-wood-500 text-sm text-center mb-8">Admin area</p>

      ${error ? /* html */ `
        <div role="alert" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
          ${escHtml(error)}
        </div>` : ""}

      <form method="POST" action="/admin/login" class="space-y-5">
        <div>
          <label for="password" class="block text-sm font-medium text-guitar-dark mb-1.5">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autofocus
            autocomplete="current-password"
            class="w-full border border-wood-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-wood-400"
          >
        </div>
        <button type="submit" class="w-full bg-wood-500 hover:bg-wood-600 text-white font-bold py-3 rounded-lg transition-colors">
          Log In
        </button>
      </form>
    </div>
  </div>`
}

function postRow(p: { slug: string; title: string; createdAt: string; published: boolean }): string {
  const date = new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  return /* html */ `
  <tr id="post-row-${p.slug}" class="border-b border-wood-50 last:border-0 hover:bg-wood-50 transition-colors">
    <td class="px-4 py-3 font-medium text-guitar-dark">${escHtml(p.title)}</td>
    <td class="px-4 py-3 text-wood-400 hidden sm:table-cell">${date}</td>
    <td class="px-4 py-3">
      <span class="text-xs font-semibold px-2 py-1 rounded-full ${p.published ? "bg-green-100 text-green-700" : "bg-wood-100 text-wood-500"}">
        ${p.published ? "Published" : "Draft"}
      </span>
    </td>
    <td class="px-4 py-3 text-right whitespace-nowrap">
      <a href="/admin/posts/${p.slug}/edit" class="text-wood-500 hover:text-wood-700 text-sm mr-3">Edit</a>
      <button
        class="text-red-400 hover:text-red-600 text-sm"
        hx-delete="/admin/posts/${p.slug}"
        hx-target="#post-row-${p.slug}"
        hx-swap="outerHTML"
        hx-confirm="Delete '${escHtml(p.title)}'?"
      >Delete</button>
      <noscript>
        <form method="POST" action="/admin/posts/${p.slug}" style="display:inline">
          <input type="hidden" name="_method" value="DELETE">
          <button type="submit" class="text-red-400 hover:text-red-600 text-sm">Delete</button>
        </form>
      </noscript>
    </td>
  </tr>`
}

function postEditor(
  existing: BlogPost | null,
  values?: Partial<BlogPost>,
  error?: string
): string {
  const v = values ?? existing ?? {}
  const isNew = !existing
  const action = isNew ? "/admin/posts" : `/admin/posts/${existing!.slug}`

  return /* html */ `
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
    <div class="flex items-center gap-4 mb-8">
      <a href="/admin/dashboard" class="text-wood-400 hover:text-wood-600 text-sm">← Dashboard</a>
      <h1 class="font-serif text-2xl font-bold text-guitar-dark">${isNew ? "New Post" : "Edit Post"}</h1>
    </div>

    ${error ? /* html */ `
      <div role="alert" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
        ${escHtml(error)}
      </div>` : ""}

    <form method="POST" action="${action}" class="space-y-6">
      <div>
        <label for="title" class="block text-sm font-medium text-guitar-dark mb-1.5">Title <span class="text-red-500">*</span></label>
        <input
          type="text" id="title" name="title" required
          value="${escHtml(v.title ?? "")}"
          class="w-full border border-wood-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-wood-400"
          placeholder="e.g. How I Set Up a Stratocaster"
        >
      </div>

      <div>
        <label for="excerpt" class="block text-sm font-medium text-guitar-dark mb-1.5">Excerpt <span class="text-wood-400 font-normal">(shown in listings)</span></label>
        <input
          type="text" id="excerpt" name="excerpt"
          value="${escHtml(v.excerpt ?? "")}"
          class="w-full border border-wood-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-wood-400"
          placeholder="One-sentence summary…"
        >
      </div>

      <!-- Editor + preview side by side -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="content" class="block text-sm font-medium text-guitar-dark">
            Content <span class="text-red-500">*</span>
            <span class="text-wood-400 font-normal ml-1">(Markdown)</span>
          </label>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <textarea
            id="content" name="content" rows="20" required
            class="border border-wood-200 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-wood-400 w-full"
            placeholder="Write in Markdown…"
            hx-post="/admin/preview"
            hx-trigger="keyup changed delay:600ms"
            hx-target="#preview-pane"
            hx-include="[name='content']"
          >${escHtml(v.content ?? "")}</textarea>
          <div
            id="preview-pane"
            class="border border-wood-100 rounded-lg px-6 py-4 bg-white min-h-[300px] prose-guitar overflow-auto"
          >
            <p class="text-wood-300 text-sm italic">Preview will appear as you type…</p>
          </div>
        </div>
        <style>
          .prose-guitar h2 { font-family: Georgia, serif; font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.5rem; }
          .prose-guitar h3 { font-family: Georgia, serif; font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.4rem; }
          .prose-guitar p  { margin-bottom: 1rem; color: #3d1f08; line-height: 1.75; }
          .prose-guitar ul { margin: 0.75rem 0 1rem 1.5rem; list-style: disc; }
          .prose-guitar code { background: #faefd9; padding: 0.1em 0.35em; border-radius: 3px; }
        </style>
      </div>

      <div class="flex items-center gap-3">
        <input
          type="checkbox" id="published" name="published"
          ${v.published ? "checked" : ""}
          class="w-4 h-4 accent-wood-500"
        >
        <label for="published" class="text-sm font-medium text-guitar-dark">Publish (visible on site)</label>
      </div>

      <div class="flex gap-4">
        <button type="submit" class="bg-wood-500 hover:bg-wood-600 text-white font-bold px-8 py-3 rounded-lg transition-colors">
          ${isNew ? "Create Post" : "Save Changes"}
        </button>
        <a href="/admin/dashboard" class="px-8 py-3 text-wood-500 hover:text-wood-700 font-medium transition-colors">
          Cancel
        </a>
      </div>
    </form>
  </div>`
}

function uploadPage(error?: string): string {
  return /* html */ `
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-10">
    <div class="flex items-center gap-4 mb-8">
      <a href="/admin/dashboard" class="text-wood-400 hover:text-wood-600 text-sm">← Dashboard</a>
      <h1 class="font-serif text-2xl font-bold text-guitar-dark">Upload Portfolio Image</h1>
    </div>

    ${error ? /* html */ `
      <div role="alert" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
        ${escHtml(error)}
      </div>` : ""}

    <form method="POST" action="/admin/portfolio/upload" enctype="multipart/form-data" class="space-y-6 bg-white rounded-xl border border-wood-100 shadow-sm p-8">
      <div>
        <label for="image" class="block text-sm font-medium text-guitar-dark mb-1.5">Image file <span class="text-red-500">*</span></label>
        <input
          type="file" id="image" name="image" required accept="image/jpeg,image/png,image/webp,image/gif"
          class="w-full text-sm text-wood-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-wood-100 file:text-wood-700 file:font-medium hover:file:bg-wood-200"
        >
        <p class="text-xs text-wood-400 mt-1">JPG, PNG, WebP, or GIF. Max 10MB.</p>
      </div>

      <div>
        <label for="alt" class="block text-sm font-medium text-guitar-dark mb-1.5">Alt text <span class="text-red-500">*</span></label>
        <input
          type="text" id="alt" name="alt" required
          class="w-full border border-wood-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-wood-400"
          placeholder="e.g. Stratocaster headstock repair, before and after"
        >
        <p class="text-xs text-wood-400 mt-1">Describes the image for screen readers and SEO.</p>
      </div>

      <div>
        <label for="caption" class="block text-sm font-medium text-guitar-dark mb-1.5">Caption <span class="text-wood-400 font-normal">(optional)</span></label>
        <input
          type="text" id="caption" name="caption"
          class="w-full border border-wood-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-wood-400"
          placeholder="e.g. 1972 Telecaster neck reset — back to factory spec"
        >
      </div>

      <button type="submit" class="w-full bg-wood-500 hover:bg-wood-600 text-white font-bold py-3 rounded-lg transition-colors">
        Upload Image
      </button>
    </form>
  </div>`
}

function imageThumb(img: { filename: string; alt: string }): string {
  return /* html */ `
  <div id="img-${img.filename}" class="relative group rounded-lg overflow-hidden bg-wood-100 aspect-square">
    <img
      src="/images/${encodeURIComponent(img.filename)}"
      alt="${escHtml(img.alt)}"
      loading="lazy"
      class="w-full h-full object-cover"
    >
    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <form method="POST" action="/admin/portfolio/${encodeURIComponent(img.filename)}/delete">
        <button
          type="submit"
          class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded"
          hx-post="/admin/portfolio/${encodeURIComponent(img.filename)}/delete"
          hx-target="#img-${img.filename}"
          hx-swap="outerHTML"
          hx-confirm="Delete this image?"
        >Delete</button>
      </form>
    </div>
  </div>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
