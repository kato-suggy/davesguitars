import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"
import { sendContactEmail } from "../lib/email"
import site from "../../content/site.json"

export const contactRoute = new Hono<{ Bindings: Env }>()

const REPAIR_TYPES = [
  "Full setup",
  "Fretwork / refret",
  "Electronics / wiring",
  "Structural repair",
  "Restoration",
  "Custom build enquiry",
  "Other / not sure",
]

const GUITAR_TYPES = [
  "Electric guitar",
  "Acoustic guitar",
  "Bass guitar",
  "Classical / nylon string",
  "Semi-hollow / archtop",
  "12-string",
  "Other",
]

contactRoute.get("/", (c) => {
  const message = c.req.query("message")
  const banner = message === "sent"
    ? /* html */ `<div role="alert" class="bg-green-50 border border-green-200 text-green-800 rounded-lg px-6 py-4 mt-8 mb-8 text-center">
        <strong>Message sent!</strong> I'll get back to you within 24 hours.
       </div>`
    : message === "error"
    ? /* html */ `<div role="alert" class="bg-red-50 border border-red-200 text-red-800 rounded-lg px-6 py-4 mt-8 mb-8 text-center">
        <strong>Something went wrong.</strong> Please try again, or contact me directly using the details above.
       </div>`
    : ""

  return c.html(layout(contactPage(banner), {
    title: "Get a quote",
    description: "Request a guitar repair quote, or contact Dave directly by phone, email, or Instagram.",
    canonicalPath: "/contact",
  }))
})

contactRoute.post("/", async (c) => {
  const form = await c.req.formData()

  const name       = (form.get("name")        as string ?? "").trim()
  const email      = (form.get("email")       as string ?? "").trim()
  const guitarType = (form.get("guitarType")  as string ?? "").trim()
  const repairType = (form.get("repairType")  as string ?? "").trim()
  const message    = (form.get("message")     as string ?? "").trim()

  const errors: Record<string, string> = {}
  if (!name)       errors.name       = "Please enter your name."
  if (!email || !email.includes("@"))
                   errors.email      = "Please enter a valid email address."
  if (!guitarType) errors.guitarType = "Please select a guitar type."
  if (!repairType) errors.repairType = "Please select a repair type."
  if (!message || message.length < 10)
                   errors.message    = "Please describe what your guitar needs (at least 10 characters)."

  if (Object.keys(errors).length > 0) {
    return c.html(layout(contactPage("", { name, email, guitarType, repairType, message, errors }), {
      title: "Get a quote",
      description: "Request a guitar repair quote.",
      canonicalPath: "/contact",
    }))
  }

  const result = await sendContactEmail(
    { name, email, guitarType, repairType, message },
    { RESEND_API_KEY: c.env.RESEND_API_KEY, CONTACT_EMAIL: c.env.CONTACT_EMAIL }
  )

  return c.redirect(result.ok ? "/contact?message=sent" : "/contact?message=error", 303)
})

type FormValues = {
  name?: string
  email?: string
  guitarType?: string
  repairType?: string
  message?: string
  errors?: Record<string, string>
}

function contactPage(banner: string, values: FormValues = {}): string {
  const { hero } = site.contactPage

  return /* html */ `
    <section class="bg-ink py-14 md:py-20 text-center">
      <div class="max-w-3xl mx-auto px-5 md:px-8">
        <h1 class="text-white">${hero.heading}</h1>
        <p class="lead mx-auto" style="color: #d4d8d4; max-width: 36rem;">
          ${hero.lead}
        </p>
      </div>
    </section>

    ${directContactBlock()}

    <section class="max-w-2xl mx-auto px-5 md:px-8 pb-14 md:pb-20">
      ${banner}
      ${formFragment(values)}
    </section>
  `
}

function directContactBlock(): string {
  const c = site.contact
  return /* html */ `
    <section class="max-w-3xl mx-auto px-5 md:px-8 pt-12 md:pt-16">
      <div class="bg-mint border border-mint-deep rounded-lg p-6 md:p-8">
        <p class="eyebrow mb-3" style="color: var(--slate-700);">Prefer to talk?</p>
        <h2 class="m-0 mb-4" style="color: var(--slate-ink);">Call, email, or DM</h2>
        <p class="mb-5" style="color: var(--slate-ink); max-width: none;">
          Many customers prefer a direct chat to filling in a form — that's fine. Reach me any of these ways:
        </p>
        <ul class="grid grid-cols-1 sm:grid-cols-3 gap-3" role="list">
          <li>
            <a href="tel:${c.phoneTel}"
               class="block bg-ivory border border-mint-deep rounded-md px-4 py-3 no-underline transition-colors hover:bg-bone-2"
               style="color: var(--slate-ink);">
              <p class="eyebrow m-0 mb-1 flex items-center gap-1.5" style="color: var(--slate-600);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Phone
              </p>
              <p class="font-display font-semibold text-base m-0">${c.phoneDisplay}</p>
            </a>
          </li>
          <li>
            <a href="mailto:${c.email}"
               class="block bg-ivory border border-mint-deep rounded-md px-4 py-3 no-underline transition-colors hover:bg-bone-2"
               style="color: var(--slate-ink);">
              <p class="eyebrow m-0 mb-1 flex items-center gap-1.5" style="color: var(--slate-600);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                Email
              </p>
              <p class="font-display font-semibold text-sm m-0 break-all">${c.email}</p>
            </a>
          </li>
          <li>
            <a href="${c.instagramUrl}" rel="me noopener" target="_blank"
               class="block bg-ivory border border-mint-deep rounded-md px-4 py-3 no-underline transition-colors hover:bg-bone-2"
               style="color: var(--slate-ink);">
              <p class="eyebrow m-0 mb-1 flex items-center gap-1.5" style="color: var(--slate-600);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                Instagram
              </p>
              <p class="font-display font-semibold text-base m-0">${c.instagramHandle}</p>
            </a>
          </li>
        </ul>
        <p class="text-xs mt-4 mb-0" style="color: var(--slate-700);">
          Workshop in ${c.addressLocality}, ${c.addressRegion} · ${c.postcode}
        </p>
      </div>

      <p class="text-center text-sm mt-8" style="color: var(--fg-muted);">
        — or send the details below and I'll come back to you —
      </p>
    </section>
  `
}

function formFragment(values: FormValues = {}): string {
  const { name = "", email = "", guitarType = "", repairType = "", message = "", errors = {} } = values

  return /* html */ `
  <form action="/contact" method="POST" class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      ${field({
        id: "name", label: "Your name", type: "text",
        value: name, error: errors.name,
        required: true, autocomplete: "name",
      })}
      ${field({
        id: "email", label: "Email address", type: "email",
        value: email, error: errors.email,
        required: true, autocomplete: "email",
      })}
    </div>

    ${select({
      id: "guitarType", label: "Type of guitar",
      options: GUITAR_TYPES, value: guitarType, error: errors.guitarType,
    })}

    ${select({
      id: "repairType", label: "What does it need?",
      options: REPAIR_TYPES, value: repairType, error: errors.repairType,
    })}

    <div>
      <label for="message" class="block text-sm font-medium text-slate-ink mb-1.5">
        Tell me more <span class="text-red-500" aria-hidden="true">*</span>
      </label>
      <textarea
        id="message"
        name="message"
        rows="5"
        required
        aria-describedby="${errors.message ? "message-error" : ""}"
        class="w-full border ${errors.message ? "border-red-400 bg-red-50" : "border-slate-200"} rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brass transition"
        placeholder="Describe the issue, any relevant history, your timeline…"
      >${message}</textarea>
      ${errors.message ? `<p id="message-error" role="alert" class="mt-1 text-xs text-red-600">${errors.message}</p>` : ""}
    </div>

    <!-- Honeypot anti-spam -->
    <input type="text" name="website" class="hidden" tabindex="-1" autocomplete="off">

    <button
      type="submit"
      class="w-full bg-ink hover:bg-slate-800 text-white font-display font-semibold px-6 py-4 rounded-md transition-colors shadow-md text-base"
    >
      Send quote request
    </button>

    <p class="text-xs text-slate-400 text-center">
      I'll respond within 24 hours. No spam, no mailing lists.
    </p>
  </form>`
}

type FieldOpts = {
  id: string
  label: string
  type: string
  value: string
  error?: string
  required?: boolean
  autocomplete?: string
}

function field(opts: FieldOpts): string {
  const { id, label, type, value, error, required, autocomplete } = opts
  return /* html */ `
  <div>
    <label for="${id}" class="block text-sm font-medium text-slate-ink mb-1.5">
      ${label} ${required ? `<span class="text-red-500" aria-hidden="true">*</span>` : ""}
    </label>
    <input
      type="${type}"
      id="${id}"
      name="${id}"
      value="${value}"
      ${required ? "required" : ""}
      ${autocomplete ? `autocomplete="${autocomplete}"` : ""}
      ${error ? `aria-describedby="${id}-error"` : ""}
      class="w-full border ${error ? "border-red-400 bg-red-50" : "border-slate-200"} rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brass transition"
    >
    ${error ? `<p id="${id}-error" role="alert" class="mt-1 text-xs text-red-600">${error}</p>` : ""}
  </div>`
}

type SelectOpts = {
  id: string
  label: string
  options: string[]
  value: string
  error?: string
}

function select(opts: SelectOpts): string {
  const { id, label, options, value, error } = opts
  return /* html */ `
  <div>
    <label for="${id}" class="block text-sm font-medium text-slate-ink mb-1.5">
      ${label} <span class="text-red-500" aria-hidden="true">*</span>
    </label>
    <select
      id="${id}"
      name="${id}"
      required
      ${error ? `aria-describedby="${id}-error"` : ""}
      class="w-full border ${error ? "border-red-400 bg-red-50" : "border-slate-200"} rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brass transition bg-ivory"
    >
      <option value="" ${!value ? "selected" : ""}>Select…</option>
      ${options.map(o => /* html */ `
        <option value="${o}" ${value === o ? "selected" : ""}>${o}</option>
      `).join("")}
    </select>
    ${error ? `<p id="${id}-error" role="alert" class="mt-1 text-xs text-red-600">${error}</p>` : ""}
  </div>`
}
