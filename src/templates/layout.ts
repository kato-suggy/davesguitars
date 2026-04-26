/**
 * Site layout shell.
 *
 * Applies the Dave's Guitars design system (slate / mint / bone / ink palette,
 * Arimo + Georgia type) defined in src/styles/tokens.css. Page-level
 * stylesheet is built by the Tailwind CLI to public/styles.css.
 *
 * Datastar (replaces HTMX) is loaded from CDN for progressive-enhancement
 * interactions on forms etc. The mobile menu uses a native <details> element
 * so it works without any JS at all.
 */

type LayoutOptions = {
  title: string
  description?: string
  /** Used for canonical URL, OG URL, and active-nav highlighting */
  canonicalPath?: string
  /** Extra <head> content (JSON-LD, etc.) */
  head?: string
}

export function layout(content: string, opts: LayoutOptions): string {
  const {
    title,
    description = "Expert guitar repair, setups, and custom luthier work. Since 1993.",
    canonicalPath = "/",
    head = "",
  } = opts

  const fullTitle = title === "Dave's Guitars"
    ? title
    : `${title} — Dave's Guitars`

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="https://davesguitar.co.uk${canonicalPath}">

  <!-- Open Graph -->
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://davesguitar.co.uk${canonicalPath}">
  <meta property="og:image" content="https://davesguitar.co.uk/assets/logo-square.png">

  <link rel="icon" type="image/png" href="/assets/logo-square.png">

  <!-- Built CSS — design tokens + Tailwind utilities -->
  <link rel="stylesheet" href="/styles.css">

  <!-- Datastar — SSE-driven progressive enhancement -->
  <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.0-RC.7/bundles/datastar.js"></script>

  ${head}
</head>
<body class="bg-bone text-slate-ink min-h-screen flex flex-col">

  ${nav(canonicalPath)}

  <main class="flex-1">
    ${content}
  </main>

  ${footer()}

</body>
</html>`
}

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/",          label: "Home" },
  { href: "/services",  label: "What I do" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog",      label: "Blog" },
  { href: "/contact",   label: "Get a quote" },
]

function isActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === "/") return currentPath === "/"
  return currentPath === itemHref || currentPath.startsWith(itemHref + "/")
}

function nav(currentPath: string): string {
  return /* html */ `
<header class="sticky top-0 z-50 bg-ink border-b border-slate-800">
  <div class="max-w-site mx-auto px-5 md:px-8">
    <div class="flex items-center justify-between" style="height: var(--header-h);">

      <a href="/" class="inline-flex items-center no-underline" aria-label="Dave's Guitars — Home">
        <img src="/assets/logo.png" alt="Dave's Guitars" class="h-10 md:h-11 block" width="120" height="44">
      </a>

      <ul class="hidden md:flex items-center gap-7" role="list">
        ${NAV_ITEMS.map(item => desktopNavLink(item.href, item.label, isActive(item.href, currentPath))).join("")}
      </ul>

      <details class="md:hidden relative">
        <summary
          class="list-none cursor-pointer p-1.5 rounded-sm transition-colors hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="4" y1="6"  x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </summary>
        <ul
          class="absolute right-0 top-full mt-2 min-w-[220px] bg-slate-900 border border-slate-700 rounded-md shadow-lg overflow-hidden"
          role="list"
        >
          ${NAV_ITEMS.map(item => mobileNavLink(item.href, item.label, isActive(item.href, currentPath))).join("")}
        </ul>
      </details>

    </div>
  </div>
</header>`
}

function desktopNavLink(href: string, label: string, active: boolean): string {
  const baseClasses = "relative inline-block py-2 text-sm font-medium font-display no-underline transition-colors"
  const stateClasses = active
    ? "text-mint after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-mint"
    : "text-[#c4c8c4] hover:text-mint"
  return /* html */ `<li><a href="${href}" class="${baseClasses} ${stateClasses}">${label}</a></li>`
}

function mobileNavLink(href: string, label: string, active: boolean): string {
  const stateClasses = active ? "text-mint" : "text-[#c4c8c4]"
  return /* html */ `<li>
    <a href="${href}" class="block px-4 py-3 text-sm font-medium font-display no-underline border-b border-slate-800 last:border-0 ${stateClasses} hover:bg-slate-800 transition-colors">${label}</a>
  </li>`
}

function footer(): string {
  const year = new Date().getFullYear()
  return /* html */ `
<footer class="bg-ink text-[var(--fg-on-dark)] mt-24">
  <div class="max-w-site mx-auto px-5 md:px-8 py-12">

    <div class="grid grid-cols-1 md:grid-cols-3 gap-10">

      <div>
        <a href="/" class="inline-block no-underline mb-4" aria-label="Dave's Guitars — Home">
          <img src="/assets/logo.png" alt="Dave's Guitars" class="h-12" width="130" height="48">
        </a>
        <p class="text-sm leading-relaxed text-slate-300 max-w-xs">
          Expert guitar repair, setups, and custom luthier work — serving guitarists across the UK.
        </p>
      </div>

      <nav aria-label="Footer navigation">
        <p class="eyebrow mb-3 text-slate-300">Pages</p>
        <ul class="space-y-2 text-sm" role="list">
          <li><a href="/services"  class="text-slate-300 no-underline hover:text-mint transition-colors">What I do</a></li>
          <li><a href="/portfolio" class="text-slate-300 no-underline hover:text-mint transition-colors">Portfolio</a></li>
          <li><a href="/blog"      class="text-slate-300 no-underline hover:text-mint transition-colors">Blog</a></li>
          <li><a href="/contact"   class="text-slate-300 no-underline hover:text-mint transition-colors">Get a quote</a></li>
        </ul>
      </nav>

      <div>
        <p class="eyebrow mb-3 text-slate-300">Get in touch</p>
        <p class="text-sm leading-relaxed text-slate-300">
          Got a guitar that needs attention?<br>
          <a href="/contact" class="text-mint no-underline hover:text-mint-deep transition-colors">
            Send a message →
          </a>
        </p>
      </div>
    </div>

    <div class="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-400">
      <p>© ${year} Dave's Guitars. All rights reserved.</p>
      <p class="eyebrow text-slate-300">Since 1993</p>
    </div>
  </div>
</footer>`
}
