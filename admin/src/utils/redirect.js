// AI-GENERATED — not an architecture reference

/**
 * Leaves this application for another address. A function of its own so that a test can
 * replace it: `window.location` itself cannot be replaced in a browser.
 */
export const redirectTo = (url) => {
  window.location.assign(url)
}
