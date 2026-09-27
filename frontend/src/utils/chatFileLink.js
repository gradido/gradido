// AI-GENERATED — not an architecture reference

/**
 * Files in the chat go through SwissTransfer, a free service of Infomaniak in Switzerland
 * (E-042): Gradido stores none. Whoever wants to send a file uploads it there and sends the link
 * as an ordinary message -- a suggestion, not a Gradido service, as the video call is. The thread
 * shows such a link as a file card that names where it leads (ChatFileCard, E-044).
 *
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
 * An address cut into what the checks read: the host in small letters, as a browser reads it; the
 * path as it is written; the query without its `?`, and the `#` part. `https` only, and a plain
 * host: a name before an `@`, a port or a space leave no address -- the card could not say where
 * the browser goes.
 */
const ADDRESS = /^https:\/\/([a-z0-9.-]+)(\/[^?#]*)?(?:\?([^#]*))?(#.*)?$/

const cut = (url) => {
  if (typeof url !== 'string' || /\s/.test(url)) return null
  const address = ADDRESS.exec(url.replace(/^[^:/?#]+:\/\/[^/?#]*/, (head) => head.toLowerCase()))
  return address
    ? { host: address[1], path: address[2] ?? '', query: address[3], hash: address[4] }
    : null
}

/**
 * The services a card stands for, each by the addresses its own code or links name -- never by
 * a guess: SwissTransfer's app shares from a second host, and the card did not know it (#3997).
 * A card vouches for its destination ("File on SwissTransfer"), so the HOST is what counts: a
 * look-alike (`swisstransfer.com.example.org`, `evil-swisstransfer.com`, `swisstransfer.co`) gets
 * no card and stays an ordinary link, which shows its whole address. The path is compared as it
 * is written.
 *
 * `rest`: whether a query or a `#` may follow. SwissTransfer's own recognition takes no query (a
 * password in the address, say), and neither does the card: such a link stays an ordinary link.
 */
const FILE_SERVICES = [
  {
    // The two production addresses in `ApiEnvironment.kt` (Infomaniak/multiplatform-SwissTransfer):
    // the website shares from `swisstransfer.com` (any of its subdomains is SwissTransfer's), the
    // apps from `swisstransfer.infomaniak.com` -- that host alone, since Infomaniak runs other
    // services under `infomaniak.com`. A language of two letters where the link has one, then
    // `/d/` or `/dl/` and an id. Stricter than SwissTransfer's own `ApiUrlMatcher.kt`, which asks
    // nothing of the host: it only ever sees links that were shared with it.
    name: 'SwissTransfer',
    forms: [
      {
        host: /^(?:[a-z0-9-]+\.)*swisstransfer\.com$|^swisstransfer\.infomaniak\.com$/,
        path: /^(?:\/[a-z]{2})?\/(?:d|dl)\/[^/]+$/,
      },
    ],
    rest: false,
  },
]

/**
 * @param {string} url an address as the thread found it (chatTextParts)
 * @returns {string | null} the service a file card names, or null: an ordinary link
 */
export const fileLinkService = (url) => {
  const address = cut(url)
  if (!address) return null
  const service = FILE_SERVICES.find(({ forms }) =>
    forms.some(
      ({ host, path, query }) =>
        host.test(address.host) &&
        path.test(address.path) &&
        (!query || query.test(address.query ?? '')),
    ),
  )
  if (!service) return null
  if (!service.rest && (address.query !== undefined || address.hash !== undefined)) return null
  return service.name
}

/**
 * @param {string} url an address as the thread found it (chatTextParts)
 * @returns {boolean} whether it is a link to files on SwissTransfer
 */
export const isSwissTransferLink = (url) => fileLinkService(url) === 'SwissTransfer'

/**
 * What the card shows as its destination: host and path, the host in small letters and without
 * `www.` -- `swisstransfer.com/dl/…` or `swisstransfer.infomaniak.com/dl/…`.
 *
 * @param {string} url a link `fileLinkService` names a service for
 * @returns {string}
 */
export const fileLinkLabel = (url) => {
  const address = cut(url)
  return address ? `${address.host.replace(/^www\./, '')}${address.path}` : ''
}
