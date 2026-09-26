// AI-GENERATED — not an architecture reference
import { DomainError, Result, VoidResult } from 'shared'

/**
 * What the check of a Jitsi server reads from its two answers, and why a server does not do for
 * the chat's video rooms (V1). The network half is jitsiProbe.ts; everything here works on text.
 */

/** Why a server does not do, as the check finds it. */
export type JitsiProbeFailure =
  // No answer in time, or none at all: down, not found, too slow.
  | 'UNREACHABLE'
  // An answer, but no Jitsi configuration at config.js.
  | 'NOT_JITSI'
  // config.js sends people to a login first: an active anonymousdomain or tokenAuthUrl.
  | 'LOGIN_REQUIRED'
  // The XMPP server opens a session, but not without an account: no ANONYMOUS.
  | 'NO_ANONYMOUS'
  // No XMPP session over BOSH at http-bind. A server that only speaks WebSocket stays out.
  | 'NO_BOSH'

export class JitsiProbeError extends DomainError {
  constructor(
    public readonly host: string,
    public readonly reason: JitsiProbeFailure,
    public readonly detail: string,
  ) {
    super(`JITSI_PROBE_${reason} on ${host}: ${detail}`)
  }
}

const QUOTES = new Set(["'", '"', '`'])

/**
 * config.js without its comments: what does not run says nothing about the server. Jitsi's own
 * default config.js carries its settings commented out -- `// anonymousdomain:
 * 'guest.example.com'` among them -- and names `tokenAuthUrl` in a block comment (measured on
 * 25.09.2026 at the nine default servers).
 *
 * One pass that knows strings: `//` and `/*` inside quotes are text. `bosh: '//meet.x/http-bind'`
 * stays, and a `/*` in one string cannot reach a closing mark in a later one and swallow the
 * settings between them. A comment after code on the same line goes, the code stays. A quote that
 * is not closed ends with its line (' and " cannot span lines), so a sign taken for a quote by
 * mistake -- in a regular expression, say -- costs one line at most.
 */
const activeCode = (text: string): string => {
  let active = ''
  let quote: string | null = null
  let index = 0
  while (index < text.length) {
    const character = text[index]
    const next = text[index + 1]
    if (quote !== null) {
      if (character === '\\') {
        active += character + (next ?? '')
        index += 2
        continue
      }
      if (character === quote || (character === '\n' && quote !== '`')) {
        quote = null
      }
      active += character
      index += 1
    } else if (character === '/' && next === '/') {
      const end = text.indexOf('\n', index)
      index = end === -1 ? text.length : end
    } else if (character === '/' && next === '*') {
      const end = text.indexOf('*/', index + 2)
      index = end === -1 ? text.length : end + 2
    } else {
      if (QUOTES.has(character)) {
        quote = character
      }
      active += character
      index += 1
    }
  }
  return active
}

// The two forms config.js comes in: `domain: '…'` inside `hosts: { … }` (the Debian package,
// the nine default servers), and `config.hosts.domain = '…'` (the Docker images, fairmeeting.net).
const HOSTS_DOMAIN = /\bhosts\s*[:=]\s*\{[^}]*?\bdomain\s*:\s*['"]([A-Za-z0-9.-]+)['"]/
const ASSIGNED_DOMAIN = /\bhosts\.domain\s*=\s*['"]([A-Za-z0-9.-]+)['"]/
// Either form of both, with a value: a guest domain means a room is opened by somebody with an
// account first; a token URL sends everybody to a login.
const ANONYMOUS_DOMAIN = /\banonymousdomain\s*[:=]/
const TOKEN_AUTH_URL = /\btokenAuthUrl\s*[:=]\s*['"`]/

/**
 * What config.js says: whether it is a Jitsi configuration (`hosts`), whether rooms need a login
 * first, and the XMPP domain the BOSH request is addressed to -- null where config.js names none
 * in either form; the probe takes the server's host then.
 */
export const evaluateJitsiConfig = (
  text: string,
): Result<{ domain: string | null }, 'NOT_JITSI' | 'LOGIN_REQUIRED'> => {
  const active = activeCode(text)
  if (!/\bhosts\b/.test(active)) {
    return { success: false, error: 'NOT_JITSI' }
  }
  if (ANONYMOUS_DOMAIN.test(active) || TOKEN_AUTH_URL.test(active)) {
    return { success: false, error: 'LOGIN_REQUIRED' }
  }
  const domain = (HOSTS_DOMAIN.exec(active) ?? ASSIGNED_DOMAIN.exec(active))?.[1] ?? null
  return { success: true, value: { domain } }
}

/**
 * The first request of an XMPP session over BOSH (XEP-0124/XEP-0206). The answer lists the ways
 * the server lets somebody in; nobody logs in, the session lapses on the server by itself.
 */
export const boshSessionRequest = (domain: string, rid: number): string =>
  `<body rid='${rid}' xmlns='http://jabber.org/protocol/httpbind' to='${domain}' xml:lang='en' ` +
  `wait='5' hold='1' content='text/xml; charset=utf-8' ver='1.6' xmpp:version='1.0' ` +
  `xmlns:xmpp='urn:xmpp:xbosh'/>`

/**
 * What the answer to boshSessionRequest says: ANONYMOUS among the ways in means a room opens
 * without an account. Ways in without it: NO_ANONYMOUS. No ways in at all -- an error page, a
 * session refused: NO_BOSH.
 */
export const evaluateBoshFeatures = (text: string): VoidResult<'NO_ANONYMOUS' | 'NO_BOSH'> => {
  if (/<mechanism>\s*ANONYMOUS\s*<\/mechanism>/.test(text)) {
    return { success: true }
  }
  if (/<mechanisms\b/.test(text)) {
    return { success: false, error: 'NO_ANONYMOUS' }
  }
  return { success: false, error: 'NO_BOSH' }
}
