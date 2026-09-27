// AI-GENERATED — not an architecture reference

/**
 * Files in the chat go through SwissTransfer, a free service of Infomaniak in Switzerland
 * (E-042): Gradido stores none. Whoever wants to send a file uploads it there and sends the link
 * as an ordinary message -- a suggestion, not a Gradido service, as the video call is. The thread
 * shows such a link as a file card that names where it leads (ChatFileCard, E-044).
 *
 * ⛔ Nothing here asks SwissTransfer anything: no preview, no file names, no request of any kind
 * before somebody taps the card -- a fetch would tell a third party that the message was read
 * (Notiz 23.09. §5). SwissTransfer has no public interface anyway (Notiz 27.09. §4.5).
 */

/**
 * Where the hint's button leads: SwissTransfer's front page, without a language in the path. The
 * page sends a browser on to its own language (measured 27.09.2026: `Accept-Language: de` goes to
 * `/de`, `tr` and `ru` go to `/en`; `/tr` itself is a 404) -- as gradido.net links go without one.
 */
export const SWISSTRANSFER_URL = 'https://www.swisstransfer.com/'

/**
 * A link to files on SwissTransfer, and nothing else: `https`, the host `swisstransfer.com` or one
 * of its subdomains, a language of two letters where the link has one, then `/d/` or `/dl/` and an
 * id without `/`, `?`, `#` or a space.
 *
 * ⛔ Stricter than SwissTransfer's own recognition, on purpose. Its apps match `^https://.+/d/[^?]+`
 * and `^https://.+/dl/[^?]+` (`ApiUrlMatcher.kt` in Infomaniak/multiplatform-SwissTransfer) and ask
 * nothing of the host: they only ever see links that were shared with them. The card here vouches
 * for the destination -- it says "File on SwissTransfer" -- so the host is what counts:
 * `swisstransfer.com.example.org`, `evil-swisstransfer.com` or `swisstransfer.co` get no card and
 * stay ordinary links, which show their whole address. So does a link with a query or a `#` (a
 * password in the address, say): the card would hide what it carries.
 *
 * Scheme and host are compared in small letters, as a browser reads them; the path as it is
 * written, as SwissTransfer's own recognition reads it.
 */
const SWISSTRANSFER_LINK =
  /^https:\/\/(?:[a-z0-9-]+\.)*swisstransfer\.com(?:\/[a-z]{2})?\/(?:d|dl)\/[^/?#\s]+$/

/** The address with its scheme and host in small letters, and the rest as it is. */
const withSmallHost = (url) => url.replace(/^[^:/?#]+:\/\/[^/?#]*/, (head) => head.toLowerCase())

/**
 * @param {string} url an address as the thread found it (chatTextParts)
 * @returns {boolean} whether the thread shows it as a file card
 */
export const isSwissTransferLink = (url) =>
  typeof url === 'string' && SWISSTRANSFER_LINK.test(withSmallHost(url))

/**
 * What the card shows as its destination: the address without `https://` and without `www.`,
 * the host in small letters -- `swisstransfer.com/d/…`.
 *
 * @param {string} url a link `isSwissTransferLink` accepts
 * @returns {string}
 */
export const swissTransferLabel = (url) => withSmallHost(url).replace(/^https:\/\/(?:www\.)?/, '')
