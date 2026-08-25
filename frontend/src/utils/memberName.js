// AI-GENERATED — not an architecture reference

/**
 * What the wallet calls another member by (NU-018): their alias, and without one the FULL
 * gradidoID. Not shortened -- the full identifier can be pasted into the send form and
 * resolved, a shortened one is decoration. Rows are kept from bursting by CSS, not by
 * cutting the value.
 *
 * ⛔ The rule itself is the point of this file. It sat inline at six call sites that all
 * had to agree, and one of them (`ThankYouCardPaymentResolver` on the other side) had
 * already drifted. A member is identified in one place now.
 *
 * Takes the member rather than two strings on purpose: two positional strings of the same
 * type can be swapped at a call site and nothing would say so, and the optional chaining
 * every caller needs anyway lives here instead of five times over.
 *
 * @param {{alias?: string|null, gradidoID?: string|null}|null|undefined} member
 * @returns {string} the alias, else the gradidoID, else '' -- never null
 */
export const memberAlias = (member) => member?.alias || member?.gradidoID || ''
