/**
 * Google Business reviews via Places API (legacy).
 *
 * Fetches Place Details with the `reviews` field and surfaces a trimmed,
 * normalised list. Cached in Cloudflare Workers Cache API for 24h so we
 * make at most one outbound call per place per day regardless of traffic.
 *
 * Falls back to an empty array on any failure — the homepage hides the
 * section entirely rather than showing a broken/loading state, per the
 * design system's credibility-cue rules.
 */

import type { Review } from "../types"

/** Hard cap, design-system rule: pull 3 most recent reviews. */
const REVIEWS_TO_RENDER = 3

/** 24 hours — Places quota is per-day, reviews change rarely. */
const CACHE_TTL_SECONDS = 60 * 60 * 24

/** A synthetic URL used purely as a cache key. Never fetched. */
const cacheKeyFor = (placeId: string): Request =>
  new Request(`https://internal.cache/places-reviews/${encodeURIComponent(placeId)}`)

/**
 * Fetch reviews for a Google Place. Returns up to {@link REVIEWS_TO_RENDER}
 * reviews, sorted newest-first. Returns `[]` on any failure.
 */
export async function fetchReviews(placeId: string, apiKey: string): Promise<Review[]> {
  if (!placeId || !apiKey || placeId === "PLACEHOLDER_PLACE_ID") {
    return []
  }

  const cache = caches.default
  const key = cacheKeyFor(placeId)

  const cached = await cache.match(key)
  if (cached) {
    try {
      return await cached.json<Review[]>()
    } catch {
      // Corrupted cache entry — fall through and re-fetch.
    }
  }

  const reviews = await fetchFromPlaces(placeId, apiKey)

  const cacheable = new Response(JSON.stringify(reviews), {
    headers: {
      "content-type":  "application/json; charset=utf-8",
      "cache-control": `public, max-age=${CACHE_TTL_SECONDS}`,
    },
  })
  await cache.put(key, cacheable)

  return reviews
}

/* -------------------------------------------------- internal */

type PlacesApiResponse = {
  status: string
  result?: {
    rating?: number
    user_ratings_total?: number
    reviews?: PlacesApiReview[]
  }
}

type PlacesApiReview = {
  author_name?: string
  rating?: number
  text?: string
  time?: number
  relative_time_description?: string
}

async function fetchFromPlaces(placeId: string, apiKey: string): Promise<Review[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json")
  url.searchParams.set("place_id", placeId)
  // Limit fields to keep us in the cheaper "Atmosphere" SKU.
  url.searchParams.set("fields", "reviews,rating,user_ratings_total")
  url.searchParams.set("key", apiKey)

  let response: Response
  try {
    response = await fetch(url.toString())
  } catch {
    return []
  }

  if (!response.ok) return []

  let data: PlacesApiResponse
  try {
    data = await response.json<PlacesApiResponse>()
  } catch {
    return []
  }

  if (data.status !== "OK" || !data.result?.reviews) return []

  return data.result.reviews
    .map(normaliseReview)
    .filter((r): r is Review => r !== null)
    .sort((a, b) => b.timeUnix - a.timeUnix)
    .slice(0, REVIEWS_TO_RENDER)
}

function normaliseReview(raw: PlacesApiReview): Review | null {
  const authorName = (raw.author_name ?? "").trim()
  const rating     = raw.rating ?? 0
  const text       = (raw.text ?? "").trim()
  const timeUnix   = raw.time ?? 0
  if (!authorName || !text || rating < 1 || rating > 5) return null

  return {
    authorName,
    authorInitials: initialsFrom(authorName),
    rating,
    text,
    timeUnix,
    relativeTime: raw.relative_time_description ?? "",
  }
}

/** "John Smith" → "JS"; "Mary Jane Doe" → "MJD"; capped at 3 chars. */
function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(part => part[0]!.toUpperCase())
    .join("")
}
