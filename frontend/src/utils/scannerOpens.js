// AI-GENERATED — not an architecture reference

/**
 * Counts scanner starts in this browser session.
 *
 * The scanner tells people, from the second start on, how to make the browser's camera
 * question stop coming back. "Second start" needs a counter that outlives a route change
 * — and, ideally, a reload: `sessionStorage` does both. Some private modes refuse to
 * write to it, and a refused storage must not silently mean "never show the hint"
 * (coderabbit, PR #3778) — so the count also lives here, in module scope, which is once
 * per page session: the span the hint is about.
 *
 * ⛔ A module of its own rather than a line in the page: module state inside
 * `<script setup>` is re-created on every mount, and a plain `<script>` block beside it
 * collides with `import/first`. Here the scope is simply what it says.
 */

const SCANNER_OPENS_KEY = 'scanner-opens'

let inMemory = 0

/** @returns {number} how many times the scanner has started in this session, this one included */
export const countScannerOpen = () => {
  inMemory += 1
  try {
    const count = Number(window.sessionStorage.getItem(SCANNER_OPENS_KEY) ?? 0) + 1
    window.sessionStorage.setItem(SCANNER_OPENS_KEY, String(count))
    return count
  } catch {
    return inMemory
  }
}
