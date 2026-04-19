type ContactEmailPayload = {
  name: string
  email: string
  guitarType: string
  repairType: string
  message: string
}

export async function sendContactEmail(
  payload: ContactEmailPayload,
  env: { RESEND_API_KEY: string; CONTACT_EMAIL: string }
): Promise<{ ok: boolean; error?: string }> {
  const body = {
    from: "Dave's Guitars <noreply@davesguitar.co.uk>",
    to: env.CONTACT_EMAIL,
    reply_to: payload.email,
    subject: `Quote request: ${payload.repairType} — ${payload.guitarType}`,
    html: /* html */ `
      <h2>New Quote Request</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold;width:140px">Name</td><td style="padding:8px">${escHtml(payload.name)}</td></tr>
        <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${escHtml(payload.email)}">${escHtml(payload.email)}</a></td></tr>
        <tr><td style="padding:8px;font-weight:bold">Guitar type</td><td style="padding:8px">${escHtml(payload.guitarType)}</td></tr>
        <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Repair type</td><td style="padding:8px">${escHtml(payload.repairType)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${escHtml(payload.message)}</td></tr>
      </table>
      <p style="margin-top:16px;color:#888;font-size:12px">Sent via davesguitar.co.uk contact form</p>
    `,
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Resend error ${res.status}: ${text}` }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
