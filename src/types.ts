export type Env = {
  // KV namespace for blog posts
  BLOG_KV: KVNamespace

  // R2 bucket for portfolio images
  IMAGES: R2Bucket

  // Vars from wrangler.toml
  SITE_URL: string
  SITE_NAME: string

  // Secrets
  ADMIN_PASSWORD_HASH: string
  SESSION_SECRET: string
  RESEND_API_KEY: string
  CONTACT_EMAIL: string
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
