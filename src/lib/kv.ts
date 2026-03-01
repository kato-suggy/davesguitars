import type { BlogPost, BlogIndexEntry, PortfolioImage } from "../types"

// ─── Blog ─────────────────────────────────────────────────────────────────────

export async function getBlogIndex(kv: KVNamespace): Promise<BlogIndexEntry[]> {
  const raw = await kv.get("posts:index")
  if (!raw) return []
  try {
    return JSON.parse(raw) as BlogIndexEntry[]
  } catch {
    return []
  }
}

export async function getBlogPost(kv: KVNamespace, slug: string): Promise<BlogPost | null> {
  const raw = await kv.get(`post:${slug}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as BlogPost
  } catch {
    return null
  }
}

export async function saveBlogPost(kv: KVNamespace, post: BlogPost): Promise<void> {
  await kv.put(`post:${post.slug}`, JSON.stringify(post))

  // Update the index
  const index = await getBlogIndex(kv)
  const entry: BlogIndexEntry = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    published: post.published,
    createdAt: post.createdAt,
  }

  const existing = index.findIndex(e => e.slug === post.slug)
  if (existing >= 0) {
    index[existing] = entry
  } else {
    index.unshift(entry) // newest first
  }

  await kv.put("posts:index", JSON.stringify(index))
}

export async function deleteBlogPost(kv: KVNamespace, slug: string): Promise<void> {
  await kv.delete(`post:${slug}`)

  const index = await getBlogIndex(kv)
  const updated = index.filter(e => e.slug !== slug)
  await kv.put("posts:index", JSON.stringify(updated))
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function getPortfolioImages(kv: KVNamespace): Promise<PortfolioImage[]> {
  const raw = await kv.get("portfolio:index")
  if (!raw) return []
  try {
    return JSON.parse(raw) as PortfolioImage[]
  } catch {
    return []
  }
}

export async function addPortfolioImage(kv: KVNamespace, image: PortfolioImage): Promise<void> {
  const images = await getPortfolioImages(kv)
  images.unshift(image) // newest first
  await kv.put("portfolio:index", JSON.stringify(images))
}

export async function deletePortfolioImage(kv: KVNamespace, filename: string): Promise<void> {
  const images = await getPortfolioImages(kv)
  const updated = images.filter(i => i.filename !== filename)
  await kv.put("portfolio:index", JSON.stringify(updated))
}

// ─── Slugs ────────────────────────────────────────────────────────────────────

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}
