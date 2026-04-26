import type { Config } from "tailwindcss"

/**
 * Tailwind config for Dave's Guitars.
 *
 * Colors and fonts are aliased to CSS variables defined in src/styles/tokens.css.
 * Anywhere a utility like `bg-slate-600` is used, the resolved value is
 * `var(--slate-600)` — so the design tokens remain the single source of truth
 * and could later be re-themed without touching components.
 */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        // Design-system slate scale (overrides Tailwind's default slate)
        slate: {
          DEFAULT: "var(--slate)",
          ink:     "var(--slate-ink)",
          50:      "var(--slate-50)",
          100:     "var(--slate-100)",
          200:     "var(--slate-200)",
          300:     "var(--slate-300)",
          400:     "var(--slate-400)",
          500:     "var(--slate-500)",
          600:     "var(--slate-600)",
          700:     "var(--slate-700)",
          800:     "var(--slate-800)",
          900:     "var(--slate-900)",
        },
        mint: {
          DEFAULT: "var(--mint)",
          deep:    "var(--mint-deep)",
        },
        bone: {
          DEFAULT: "var(--bone)",
          2:       "var(--bone-2)",
        },
        ivory: "var(--ivory)",
        ink:   "var(--ink)",
        brass: {
          DEFAULT: "var(--brass)",
          dark:    "var(--brass-dark)",
        },
        rust: {
          DEFAULT: "var(--rust)",
          bg:      "var(--rust-bg)",
        },
      },
      fontFamily: {
        // font-sans defaults to display (Arimo) — most headings use it
        sans:    ["var(--font-display)"],
        display: ["var(--font-display)"],
        body:    ["var(--font-body)"],
        serif:   ["var(--font-body)"],
        mono:    ["var(--font-mono)"],
      },
      borderRadius: {
        xs:   "var(--radius-xs)",
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      maxWidth: {
        measure: "var(--measure)",
        site:    "var(--maxw)",
      },
    },
  },
  plugins: [],
} satisfies Config
