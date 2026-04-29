export type Env = {
  // Vars from wrangler.toml
  SITE_URL: string
  SITE_NAME: string
  /** Google Place ID for Dave's Business listing — used for the reviews feed */
  PLACE_ID: string

  // Secrets
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
