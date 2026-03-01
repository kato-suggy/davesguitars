import { marked } from "marked"

// Configure marked with sane defaults
marked.setOptions({
  gfm: true,    // GitHub Flavored Markdown
  breaks: false,
})

/**
 * Parse markdown to HTML.
 * We run a basic allowlist sanitiser since DOMPurify requires a DOM
 * environment. Cloudflare Workers have no DOM — we strip dangerous patterns
 * instead. Fine for trusted admin-only input.
 */
export function parseMarkdown(md: string): string {
  const html = marked.parse(md) as string
  return sanitizeHtml(html)
}

/** Very light sanitiser — strips <script>, event handlers, javascript: hrefs */
function sanitizeHtml(html: string): string {
  return html
    // Remove <script> blocks
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // Remove on* event attributes
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    // Remove javascript: href/src
    .replace(/href="javascript:[^"]*"/gi, 'href="#"')
    .replace(/src="javascript:[^"]*"/gi, 'src=""')
}
