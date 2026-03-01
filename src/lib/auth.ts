/**
 * Session auth for the admin panel.
 *
 * Strategy: HMAC-signed cookie.
 * - No bcrypt (not available in Workers without a polyfill)
 * - Password stored as a SHA-256 hex hash in the env secret ADMIN_PASSWORD_HASH
 * - Session token = HMAC-SHA256(userId + timestamp, SESSION_SECRET)
 * - Cookie name: __dg_session
 *
 * To generate ADMIN_PASSWORD_HASH for your password:
 *   node -e "const c=require('crypto');process.stdout.write(c.createHash('sha256').update('yourpassword').digest('hex'))"
 * Then: wrangler secret put ADMIN_PASSWORD_HASH
 */

const COOKIE_NAME = "__dg_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  )
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const attempt = await hashPassword(password)
  // Constant-time comparison
  if (attempt.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < attempt.length; i++) {
    diff |= attempt.charCodeAt(i) ^ hash.charCodeAt(i)
  }
  return diff === 0
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

export async function createSessionToken(secret: string): Promise<string> {
  const payload = `admin:${Date.now()}`
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")
  return `${payload}.${sigHex}`
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const lastDot = token.lastIndexOf(".")
  if (lastDot < 0) return false

  const payload = token.slice(0, lastDot)
  const sigHex  = token.slice(lastDot + 1)

  // Check expiry
  const parts = payload.split(":")
  const ts = parseInt(parts[1] ?? "0", 10)
  if (Date.now() - ts > SESSION_MAX_AGE * 1000) return false

  const key = await hmacKey(secret)
  const sigBuf = Uint8Array.from(sigHex.match(/.{2}/g)!.map(h => parseInt(h, 16)))

  return crypto.subtle.verify("HMAC", key, sigBuf, new TextEncoder().encode(payload))
}

export function getSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function makeSessionCookieHeader(token: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}; Path=/`
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`
}
