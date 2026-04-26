import { Hono } from "hono"
import type { Env } from "../types"
import { layout } from "../templates/layout"
import { sendContactEmail } from "../lib/email"

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
  const successBanner = message === "sent"
    ? /* html */ `<div role="alert" class="bg-green-50 border border-green-200 text-green-800 rounded-lg px-6 py-4 mb-8 text-center">
        <strong>Message sent!</strong> I'll get back to you within 24 hours.
       </div>`
    : message === "error"
    ? /* html */ `<div role="alert" class="bg-red-50 border border-red-200 text-red-800 rounded-lg px-6 py-4 mb-8 text-center">
        <strong>Something went wrong.</strong> Please try again or email me directly.
       </div>`
    : ""

  return c.html(layout(contactPage(successBanner), {
    title: "Get a quote",
    description: "Request a guitar repair quote or ask about a custom build. I'll get back to you within 24 hours.",
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

  // Validation
  const errors: Record<string, string> = {}
  if (!name)       errors.name       = "Please enter your name."
  if (!email || !email.includes("@"))
                   errors.email      = "Please enter a valid email address."
  if (!guitarType) errors.guitarType = "Please select a guitar type."
  if (!repairType) errors.repairType = "Please select a repair type."
  if (!message || message.length < 10)
                   errors.message    = "Please describe what your guitar needs (at least 10 characters)."

  // If HTMX request and validation fails — return just the form fragment
  const isHtmx = c.req.header("HX-Request") === "true"

  if (Object.keys(errors).length > 0) {
    const fragment = formFragment({ name, email, guitarType, repairType, message, errors })
    if (isHtmx) return c.html(fragment)
    return c.html(layout(contactPage("", { name, email, guitarType, repairType, message, errors }), {
      title: "Get a quote",
      description: "Request a guitar repair quote.",
      canonicalPath: "/contact",
    }))
  }

  // Send email
  const result = await sendContactEmail(
    { name, email, guitarType, repairType, message },
    { RESEND_API_KEY: c.env.RESEND_API_KEY, CONTACT_EMAIL: c.env.CONTACT_EMAIL }
  )

  if (isHtmx) {
    if (result.ok) {
      return c.html(/* html */ `
        <div role="alert" class="rounded-lg px-6 py-8 text-center" style="background: var(--success-bg); border: 1px solid #b8d4be; color: var(--success);">
          <strong class="text-lg block mb-2">Message sent.</strong>
          <p style="margin: 0; max-width: none;">I'll get back to you within 24 hours.</p>
        </div>
      `)
    } else {
      return c.html(/* html */ `
        <div role="alert" class="bg-red-50 border border-red-200 text-red-800 rounded-xl px-6 py-6 text-center">
          <strong>Something went wrong.</strong> Please try again or email me directly.
        </div>
        ${formFragment({ name, email, guitarType, repairType, message, errors: {} })}
      `)
    }
  }

  // Non-HTMX: redirect with query param
  const redirectTo = result.ok ? "/contact?message=sent" : "/contact?message=error"
  return c.redirect(redirectTo, 303)
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
  return /* html */ `
    <section class="bg-ink py-14 md:py-20 text-center">
      <div class="max-w-3xl mx-auto px-5 md:px-8">
        <p class="eyebrow text-mint mb-3">Get in touch</p>
        <h1 class="text-white">Get a quote</h1>
        <p class="lead mx-auto" style="color: #d4d8d4; max-width: 36rem;">
          Tell me about your guitar and what it needs.
        </p>
      </div>
    </section>

    <section class="max-w-2xl mx-auto px-5 md:px-8 py-14 md:py-20">
      ${banner}
      <div id="contact-form-wrapper">
        ${formFragment(values)}
      </div>
    </section>
  `
}

function formFragment(values: FormValues = {}): string {
  const { name = "", email = "", guitarType = "", repairType = "", message = "", errors = {} } = values

  return /* html */ `
  <form
    action="/contact"
    method="POST"
    class="space-y-6"
    hx-post="/contact"
    hx-target="#contact-form-wrapper"
    hx-swap="innerHTML"
    hx-indicator="#submit-btn"
  >
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
      id="submit-btn"
      type="submit"
      class="w-full bg-ink hover:bg-slate-800 text-white font-display font-semibold px-6 py-4 rounded-md transition-colors shadow-md text-base htmx-indicator:opacity-60 htmx-indicator:cursor-wait"
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
