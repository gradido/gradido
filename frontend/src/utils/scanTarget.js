// AI-GENERATED — not an architecture reference

/**
 * Reads what a scanned QR code or a hand-typed text points at.
 *
 * ## The three patterns, and nothing else
 *
 * Every Gradido QR code carries a URL (see `utils/qrCode.js` — the codes are drawn from
 * `data: link`), and there are exactly three kinds of them:
 *
 * - `…/dk/CODE`     — a thank-you card, redeemed at `ThankYouCardPayment`
 * - `…/redeem/CODE` — a cheque (transaction link), redeemed at `TransactionLink`
 * - `…/u/ALIAS`     — a Gradido card / address, the public profile
 *
 * ⛔ A scanned code is FOREIGN INPUT. Anything that does not match one of the three
 * patterns resolves to `null` and is NEVER opened — not in the wallet, not outside it.
 * Only `http:` and `https:` are read at all: a code carrying `javascript:` or `data:`
 * is an attack, not a link, and must die here rather than reach any navigation.
 *
 * ## Own community or foreign one
 *
 * Federation is the point of the network: the classic case at a counter is the thank-you
 * card of ANOTHER community. Those codes are read too — the caller shows a confirmation
 * card and jumps via `url`. A code of the own community navigates internally via `path`,
 * which is rebuilt from the matched pieces rather than taken from the foreign text.
 *
 * @param {string} text     the raw scanned or typed text
 * @param {string} ownHost  the wallet's own host (`window.location.host`, port included)
 * @returns {{ kind: 'thank-you-card'|'cheque'|'gradido-card', path: string, url: string,
 *             host: string, foreign: boolean } | null}
 */

/** Which route prefix means which kind of thing — the words the confirmation card uses. */
const KIND_BY_PREFIX = {
  dk: 'thank-you-card',
  redeem: 'cheque',
  u: 'gradido-card',
}

/**
 * The path of a Gradido target: one of the three prefixes, then EXACTLY one non-empty
 * segment. `/dk/` (nothing follows) and `/dk/a/b` (too much follows) are no match.
 * The prefix is read case-insensitively like the router would; the code itself is not,
 * because codes are case-sensitive.
 */
const PATH_PATTERN = /^\/(dk|redeem|u)\/([^/]+)\/?$/i

const matchPath = (pathname) => {
  const match = pathname.match(PATH_PATTERN)
  if (!match) {
    return null
  }
  const prefix = match[1].toLowerCase()
  return { prefix, code: match[2] }
}

export const resolveScanTarget = (text, ownHost) => {
  const trimmed = String(text ?? '').trim()
  if (trimmed === '') {
    return null
  }

  // A bare path — `/dk/CODE` or `dk/CODE`, typed off a card by hand. No host in it, so
  // it can only mean this wallet's own community.
  const asPath = matchPath(trimmed.startsWith('/') ? trimmed : `/${trimmed}`)
  if (asPath) {
    return ownTarget(asPath, ownHost)
  }

  // Everything else must parse as a URL. Hand-typed links usually come without a scheme
  // (`markt.gradido.net/dk/CODE`) — those get `https://` put in front. A text that names
  // any OTHER scheme is left alone so the whitelist below refuses it.
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`

  let url
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }

  // ⛔ The whitelist, not a blacklist: everything but plain web links is refused.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null
  }

  const matched = matchPath(url.pathname)
  if (!matched) {
    return null
  }

  // `url.host` is lowercased and port-carrying by construction; `window.location.host`
  // matches that shape. Same host means own community — the scheme does not get a vote,
  // because the internal navigation goes by path and never touches the scanned scheme.
  if (url.host.toLowerCase() === String(ownHost).toLowerCase()) {
    return ownTarget(matched, ownHost)
  }

  return {
    kind: KIND_BY_PREFIX[matched.prefix],
    path: `/${matched.prefix}/${matched.code}`,
    // The foreign jump uses the parsed URL, not the raw text — and only ever after the
    // person confirmed the host they saw on the card.
    url: url.href,
    host: url.host,
    foreign: true,
  }
}

/**
 * The own-community shape. `path` is REBUILT from the matched pieces: query, hash and
 * whatever else the foreign text carried fall away, so `router.push` only ever sees
 * `/prefix/code`.
 */
const ownTarget = ({ prefix, code }, ownHost) => ({
  kind: KIND_BY_PREFIX[prefix],
  path: `/${prefix}/${code}`,
  url: `https://${ownHost}/${prefix}/${code}`,
  host: ownHost,
  foreign: false,
})
