// AI-GENERATED — not an architecture reference

/**
 * The one line that leaves this wallet for another place.
 *
 * A module of its own for one reason: jsdom pins `window.location.assign` as
 * non-configurable and non-writable (measured 2026-08-21), so WHERE the scanner's
 * confirmed jump actually goes — its most security-relevant fact — would otherwise be
 * unassertable in any test.
 */
export const openExternalUrl = (url) => {
  window.location.assign(url)
}
