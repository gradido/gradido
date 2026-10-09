// AI-GENERATED — not an architecture reference

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/**
 * Text as it may stand inside markup that is built as a string.
 *
 * For the one place a string of markup cannot be avoided: the map engine takes a marker's inside
 * as HTML (utils/mapEngine), and a name on it was written by somebody else and comes back from a
 * foreign system. Everywhere else a template or `h()` puts text in as text, and nothing has to
 * be escaped.
 *
 * @param {unknown} text
 * @returns {string}
 */
export const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (sign) => ENTITIES[sign])
