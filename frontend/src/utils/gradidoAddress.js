// AI-GENERATED — not an architecture reference

import CONFIG from '@/config'

/**
 * The Gradido address: `community-host/u/alias`.
 *
 * One place that builds it and one that reads it, because several places that each do it
 * a little differently is how a printed address and a shown one start to disagree -- and
 * paper cannot be corrected. Building: the card, the cheque, the navigation bar. Reading:
 * the send form and the recipient validation.
 */

// The namespace that marks a person. Groups (/g/), projects (/p/) and shops (/s/) are
// planned and must never resolve to a person, so a middle part that is not this one is
// rejected rather than read as a community/user pair.
const USER_NAMESPACE = 'u'

// Wide on purpose: this one is used to RECOGNISE a scheme, including the ones that are
// not allowed, so that they can be turned away by name instead of falling through into
// some other reading.
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i
// And this is the one an address may carry. http is here for a local community, which is
// served without TLS.
const ADDRESS_SCHEME = /^https?:\/\//i

/**
 * The community host, without scheme or path -- that is what gets printed (E-008). The
 * scheme goes back on for the QR, where it decides whether a phone camera offers to open
 * the link at all.
 *
 * @param {string} url
 * @returns {string}
 */
export const communityHost = (url) => {
  try {
    return new URL(url).host
  } catch {
    return String(url ?? '')
      .replace(/^[a-z]+:\/\//i, '')
      .replace(/\/.*$/, '')
  }
}

/**
 * The alias a member's address is built on.
 *
 * The Gradido ID stands in for accounts from before the user name became compulsory.
 * `findUserByIdentifier` resolves a UUID as readily as a name, so `…/u/<uuid>` is a
 * working address rather than a placeholder -- checked against the send form.
 *
 * One line, and it lives here anyway: it stood written out in three places, and two of
 * them print. If the rule ever changes, exactly one of them would have been updated.
 * The booking list, the send form and both redeem views read it through here too, since
 * the wallet stopped delivering other members' real names (NU-018).
 *
 * ⚠️ Ends in `|| ''` so it can never hand a template `undefined`. That is not
 * hypothetical here: the word "undefined" once reached a PRINTED cheque, from a caller
 * one letter off on the field name (see useThankYouCheque). A member with neither value
 * is nobody the wallet can name, and an empty line says that better than the word.
 *
 * ⛔ The threshold, not mere truthiness. A stored name of one or two characters predates
 * the rule and is not one, so it falls back to the identifier -- which is what the server
 * does everywhere else (`shared`'s `publicAlias`). Without it the wallet printed
 * `host/u/ab` on somebody's card while every mail about them said `host/u/<uuid>`: two
 * addresses for one person, and one of them on paper. That is the exact disagreement the
 * comment at the top of this file says this module exists to prevent.
 *
 * ⚠️ The rule is written out here rather than imported: the wallet has no dependency on
 * `shared`, which is a package boundary and not an oversight. `gradidoAddress.drift.spec.js`
 * runs this function against `publicAlias` so the two copies cannot part company unnoticed.
 *
 * @param {string} username
 * @param {string} gradidoID
 * @returns {string} never null or undefined
 */
const ALIAS_MIN_CHARS = 3

export const memberAlias = (username, gradidoID) =>
  (username && username.trim().length >= ALIAS_MIN_CHARS ? username : gradidoID) || ''

/**
 * One member as one string: the uuid pair, the way the server stores a heart and the
 * avatar store keys a face. Both composables key by this, so they cannot come to mean
 * different people by the same fields.
 *
 * @param {{communityUuid?: string|null, gradidoID: string}} member
 * @returns {string}
 */
export const memberKey = ({ communityUuid, gradidoID }) => `${communityUuid ?? ''}/${gradidoID}`

/**
 * The member's own address, in the two shapes that are always needed together.
 *
 * Shown and printed without a scheme (E-008); carried with one in links and in the
 * clipboard, where it decides whether a phone camera offers to open the address at all.
 * Handing both out of one call is what keeps the card, the cheque and the navigation bar
 * from ever saying different things about the same person.
 *
 * @param {string} alias
 * @returns {{host: string, display: string, link: string}}
 */
export const gradidoAddress = (alias) => {
  const host = communityHost(CONFIG.COMMUNITY_URL)
  return {
    host,
    // Unencoded on purpose -- this one is read by a human and never navigated to.
    display: `${host}/${USER_NAMESPACE}/${alias}`,
    // The alias is encoded although no valid one needs it: VALID_ALIAS_REGEX allows letters,
    // digits, hyphen and underscore only, and the fallback is a UUID. It is here because this
    // link is printed. An unencoded '?' or '#' would silently become a query or a fragment, and
    // a wrong link on paper cannot be corrected -- so the guarantee is worth one call that
    // does nothing today, especially while the rules around user names are still moving.
    link: new URL(`/${USER_NAMESPACE}/${encodeURIComponent(alias)}`, CONFIG.COMMUNITY_URL).href,
  }
}

/**
 * The host for COMPARING, which is not the same job as printing one.
 *
 * Two differences, and each of them is a miss that would look like a typing mistake to
 * the member: host names are case-blind, and a bare `localhost:3000` reads as a scheme
 * to the URL parser, so it needs a neutral one put in front before it is parsed.
 * `communityHost` above keeps its exact behaviour because the card is printed with it.
 *
 * @param {string} value
 * @returns {string}
 */
const hostOf = (value) => {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const withScheme = SCHEME.test(text) ? text : `https://${text}`
  try {
    return new URL(withScheme).host.toLowerCase()
  } catch {
    return text.replace(SCHEME, '').replace(/\/.*$/, '').toLowerCase()
  }
}

/**
 * Whether two values name the same community host.
 *
 * Empty is never equal to empty here. The stored `url` of a community is the federation
 * endpoint and could in principle be blank, and a blank one matching a blank input would
 * hand a transfer to whichever community happens to have no URL.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export const sameHost = (a, b) => {
  const left = hostOf(a)
  return left !== '' && left === hostOf(b)
}

/**
 * Reads what somebody typed into the recipient field.
 *
 * @param {string} value
 * @returns {{community: string|null, user: string}|null} null when the shape is unknown
 */
export const splitRecipient = (value) => {
  const trimmed = String(value ?? '').trim()
  // A query or a fragment cannot be part of any of the accepted shapes, and letting one
  // through would silently make it part of the user name.
  if (!trimmed || /[?#]/.test(trimmed)) return null

  const scheme = trimmed.match(SCHEME)
  // The address is served over http(s). Another scheme would resolve to exactly the same
  // person here, because the scheme is discarded -- but it would be a line that works in
  // the wallet and nowhere a browser can follow it, and a line like that ends up in a
  // signature or on paper.
  if (scheme && !ADDRESS_SCHEME.test(scheme[0])) return null

  const hadScheme = scheme !== null
  const parts = trimmed.replace(SCHEME, '').split('/')
  // A single trailing slash is what a browser address bar hands over when it is copied.
  // Forgiven only on the full address, which is the only shape it can arise on -- take it
  // off anywhere else and `host/u/` becomes the pair (host, "u"): an address with nobody
  // in it, read as somebody called u.
  if (parts.length === 4 && parts[3] === '') parts.pop()
  if (parts.some((part) => part === '')) return null

  if (parts.length === 3) {
    // Case-blind: the namespace is a signpost, not data. Everything else stays strict.
    if (parts[1].toLowerCase() !== USER_NAMESPACE) return null
    return { community: parts[0], user: parts[2] }
  }
  // A scheme only belongs on the full address. `https://community/alias` is not a shape
  // we hand out anywhere, so accepting it would only invent a fourth one.
  if (hadScheme) return null
  if (parts.length === 2) return { community: parts[0], user: parts[1] }
  if (parts.length === 1) return { community: null, user: parts[0] }
  return null
}
