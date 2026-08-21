// AI-GENERATED — not an architecture reference

import { sameHost } from '@/utils/gradidoAddress'

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
 * "Own" is a LIST of hosts, not one: the wallet's own printed codes carry the host of
 * `COMMUNITY_URL`, while the browser may be looking at an alias of it (www vs apex, a
 * local community reached by IP — and one day a Capacitor shell, where the page's own
 * host is no community at all). A member's own cheque must never draw the foreign card
 * just because the two names differ. The comparison is `sameHost` from gradidoAddress —
 * the one definition of "same community host" the wallet already has.
 *
 * @param {string} text        the raw scanned or typed text
 * @param {string[]} ownHosts  every host that means "this wallet" — typically
 *                             `window.location.host` and the `COMMUNITY_URL` host
 * @returns {{ kind: 'thank-you-card'|'cheque'|'gradido-card', path: string,
 *             foreign: false }
 *         | { kind: 'thank-you-card'|'cheque'|'gradido-card', path: string, url: string,
 *             host: string, foreign: true }
 *         | null}
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
 * because codes are case-sensitive. `?` and `#` are excluded from the segment so a
 * query or fragment can never ride along inside a "code" — belt to the braces below.
 */
const PATH_PATTERN = /^\/(dk|redeem|u)\/([^/?#]+)\/?$/i

const matchPath = (pathname) => {
  const match = pathname.match(PATH_PATTERN)
  if (!match) {
    return null
  }
  const prefix = match[1].toLowerCase()
  return { prefix, code: match[2] }
}

/**
 * The own-community shape: only the rebuilt `path`. Query, hash and whatever else the
 * foreign text carried fall away, so `router.push` only ever sees `/prefix/code` — and
 * there is deliberately no `url` here: internal navigation goes by path, and a synthetic
 * absolute URL would only invite somebody to open it.
 */
const ownTarget = ({ prefix, code }) => ({
  kind: KIND_BY_PREFIX[prefix],
  path: `/${prefix}/${code}`,
  foreign: false,
})

export const resolveScanTarget = (text, ownHosts) => {
  const trimmed = String(text ?? '').trim()
  if (trimmed === '') {
    return null
  }

  // A bare path — `/dk/CODE` or `dk/CODE`, typed off a card by hand. No host in it, so
  // it can only mean this wallet's own community. The query/hash cut mirrors what the
  // URL branch gets from `url.pathname`: the contract is that they fall away on EVERY
  // road into `path`, not just the one the spec happened to test.
  const bare = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const asPath = matchPath(bare.split(/[?#]/)[0])
  if (asPath) {
    return ownTarget(asPath)
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

  // Any of the own hosts means own community — the scheme does not get a vote, because
  // the internal navigation goes by path and never touches the scanned scheme.
  if ((ownHosts ?? []).some((own) => sameHost(url.host, own))) {
    return ownTarget(matched)
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
