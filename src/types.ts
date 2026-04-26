export type Env = {
  // KV namespace for blog posts (removed in Phase 2 — Drive replaces it)
  BLOG_KV: KVNamespace

  // R2 bucket for portfolio images (removed in Phase 2 — Drive replaces it)
  IMAGES: R2Bucket

  // Vars from wrangler.toml
  SITE_URL: string
  SITE_NAME: string
  /** Google Place ID for Dave's Business listing — used for the reviews feed */
  PLACE_ID: string

  // Secrets
  ADMIN_PASSWORD_HASH: string
  SESSION_SECRET: string
  RESEND_API_KEY: string
  CONTACT_EMAIL: string
  /** Google Maps Platform API key, restricted to Places API (legacy) */
  GOOGLE_PLACES_API_KEY: string
}

/**
 * A single review as we surface it to templates.
 * Trimmed/normalised from the Google Places API response.
 */
export type Review = {
  authorName:   string
  authorInitials: string
  rating:       number   // integer 1–5
  text:         string
  timeUnix:     number   // seconds since epoch
  relativeTime: string   // e.g. "a month ago"
}

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export type BlogIndexEntry = {
  slug: string
  title: string
  excerpt: string
  published: boolean
  createdAt: string
}

export type PortfolioImage = {
  filename: string
  alt: string
  caption: string
  uploadedAt: string
}
