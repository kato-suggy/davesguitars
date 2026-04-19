type LayoutOptions = {
  title: string
  description?: string
  canonicalPath?: string
  /** Extra <head> content (JSON-LD, etc.) */
  head?: string
}

export function layout(content: string, opts: LayoutOptions): string {
  const {
    title,
    description = "Expert guitar repair, setups, and custom luthier work. Based in the UK.",
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

  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            wood: {
              50:  '#fdf8f0',
              100: '#faefd9',
              200: '#f3d9a8',
              300: '#e9bc6d',
              400: '#de9a3c',
              500: '#d4821e',
              600: '#b86615',
              700: '#924d13',
              800: '#763e17',
              900: '#613517',
            },
            guitar: {
              dark:   '#1a0e05',
              warm:   '#3d1f08',
              medium: '#6b3a1a',
            }
          },
          fontFamily: {
            serif: ['Georgia', 'Times New Roman', 'serif'],
            sans:  ['system-ui', '-apple-system', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <!-- HTMX -->
  <script src="/htmx.min.js" defer></script>

  <!-- Prevent FOUC on Tailwind CDN -->
  <style>
    [x-cloak] { display: none !important; }
    /* Smooth HTMX transitions */
    .htmx-swapping { opacity: 0; transition: opacity 100ms ease-out; }
    .htmx-settling { opacity: 1; transition: opacity 200ms ease-in; }
  </style>

  ${head}
</head>
<body class="bg-wood-50 text-guitar-dark font-sans min-h-screen flex flex-col">

  ${nav()}

  <main class="flex-1">
    ${content}
  </main>

  ${footer()}

</body>
</html>`
}

function nav(): string {
  return /* html */ `
<header class="bg-guitar-dark shadow-lg sticky top-0 z-50">
  <nav class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
    <div class="flex items-center justify-between h-16">

      <!-- Logo / Brand -->
      <a href="/" class="flex items-center gap-3 group" aria-label="Dave's Guitars — Home">
        <span class="text-2xl" role="img" aria-hidden="true">🎸</span>
        <span class="font-serif text-xl font-bold text-wood-200 group-hover:text-wood-100 transition-colors">
          Dave's Guitars
        </span>
      </a>

      <!-- Desktop nav links -->
      <ul class="hidden md:flex items-center gap-1" role="list">
        ${navLink("/", "Home")}
        ${navLink("/services", "Services")}
        ${navLink("/portfolio", "Portfolio")}
        ${navLink("/blog", "Blog")}
        ${navLink("/contact", "Get a Quote")}
      </ul>

      <!-- Mobile menu button -->
      <button
        class="md:hidden text-wood-200 hover:text-wood-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-wood-400"
        aria-label="Toggle menu"
        aria-expanded="false"
        aria-controls="mobile-menu"
        onclick="
          const menu = document.getElementById('mobile-menu');
          const expanded = this.getAttribute('aria-expanded') === 'true';
          this.setAttribute('aria-expanded', String(!expanded));
          menu.classList.toggle('hidden');
        "
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>

    <!-- Mobile menu -->
    <ul id="mobile-menu" class="hidden md:hidden pb-4 space-y-1" role="list">
      ${mobileNavLink("/", "Home")}
      ${mobileNavLink("/services", "Services")}
      ${mobileNavLink("/portfolio", "Portfolio")}
      ${mobileNavLink("/blog", "Blog")}
      ${mobileNavLink("/contact", "Get a Quote")}
    </ul>
  </nav>
</header>`
}

function navLink(href: string, label: string): string {
  return /* html */ `
  <li>
    <a
      href="${href}"
      class="px-4 py-2 rounded text-wood-200 hover:text-white hover:bg-guitar-medium transition-colors text-sm font-medium"
    >${label}</a>
  </li>`
}

function mobileNavLink(href: string, label: string): string {
  return /* html */ `
  <li>
    <a
      href="${href}"
      class="block px-4 py-2 rounded text-wood-200 hover:text-white hover:bg-guitar-medium transition-colors font-medium"
    >${label}</a>
  </li>`
}

function footer(): string {
  const year = new Date().getFullYear()
  return /* html */ `
<footer class="bg-guitar-dark text-wood-300 mt-16">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

      <!-- Brand -->
      <div>
        <h2 class="font-serif text-lg font-bold text-wood-100 mb-2">Dave's Guitars</h2>
        <p class="text-sm text-wood-400 leading-relaxed">
          Expert guitar repair, setups, and custom luthier work.
          Serving guitarists across the UK.
        </p>
      </div>

      <!-- Links -->
      <nav aria-label="Footer navigation">
        <h3 class="text-sm font-semibold text-wood-200 uppercase tracking-wider mb-3">Quick Links</h3>
        <ul class="space-y-2 text-sm" role="list">
          <li><a href="/services"  class="text-wood-400 hover:text-wood-100 transition-colors">Services &amp; Pricing</a></li>
          <li><a href="/portfolio" class="text-wood-400 hover:text-wood-100 transition-colors">Portfolio</a></li>
          <li><a href="/blog"      class="text-wood-400 hover:text-wood-100 transition-colors">Blog</a></li>
          <li><a href="/contact"   class="text-wood-400 hover:text-wood-100 transition-colors">Get a Quote</a></li>
        </ul>
      </nav>

      <!-- Contact -->
      <div>
        <h3 class="text-sm font-semibold text-wood-200 uppercase tracking-wider mb-3">Contact</h3>
        <p class="text-sm text-wood-400 leading-relaxed">
          Have a guitar that needs attention?<br>
          <a href="/contact" class="text-wood-300 hover:text-wood-100 transition-colors underline underline-offset-2">
            Send a quote request →
          </a>
        </p>
      </div>
    </div>

    <div class="mt-8 pt-6 border-t border-guitar-medium text-center text-xs text-wood-500">
      <p>© ${year} Dave's Guitars. All rights reserved.</p>
    </div>
  </div>
</footer>`
}
