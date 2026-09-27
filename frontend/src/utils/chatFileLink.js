// AI-GENERATED — not an architecture reference

/**
 * Files in the chat go through SwissTransfer, a free service of Infomaniak in Switzerland
 * (E-042): Gradido stores none. Whoever wants to send a file uploads it there and sends the link
 * as an ordinary message -- a suggestion, not a Gradido service, as the video call is. The thread
 * shows such a link as a file card that names where it leads (ChatFileCard, E-044).
 *
 * The card also stands for a link to files on Dropbox, Google Drive, OneDrive or WeTransfer
 * (Bernd, 27.09.2026: "the big four"), where members keep or send files anyway. The paperclip's
 * hint still suggests SwissTransfer; the card only shows what a link is. Every other link stays an
 * ordinary link -- Nextcloud's too (Bernd): it runs on any address, and only a path `/s/<token>`
 * gives it away, a token its operator may even choose, so a card for it would turn up under links
 * that are no files.
 *
 * ⛔ Nothing here asks any of them anything: no preview, no file names, no request of any kind
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
 * A card vouches for its destination ("File on Dropbox"), so the HOST is what counts: a look-alike
 * (`dropbox.com.example.org`, `evil-dropbox.com`, `dropbox.co`) gets no card and stays an ordinary
 * link, which shows its whole address. The path is compared as it is written.
 *
 * `rest`: whether a query or a `#` may follow. The links of the four carry their key there --
 * Dropbox's `rlkey`, OneDrive's `authkey` or `e`, Google's `usp` -- and the card keeps the whole
 * link as its target, showing host and path. SwissTransfer's own recognition takes no query (a
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
  {
    // yt-dlp's Dropbox extractor and its test links: `/s/` and `/sh/` (older file and folder
    // links), `/scl/fi/` and `/scl/fo/` (today's, with `rlkey`), and Dropbox Transfer's `/t/`.
    name: 'Dropbox',
    forms: [
      {
        host: /^(?:www\.)?dropbox\.com$/,
        path: /^\/(?:s|sh|scl\/fi|scl\/fo|t)\/[\w-]+(?:\/[^/]*)*$/,
      },
    ],
    rest: true,
  },
  {
    // yt-dlp's Google Drive extractors: a file (`/file/d/<id>`, or `open` / `uc` with `id=`) and
    // a folder (`/drive/folders/<id>`, also under an account's `/drive/u/<n>/`); and a document,
    // table or presentation in Google Docs, which Drive keeps.
    name: 'Google Drive',
    forms: [
      { host: /^drive\.google\.com$/, path: /^\/file\/d\/[\w-]{10,}(?:\/[\w-]*)?$/ },
      { host: /^drive\.google\.com$/, path: /^\/drive\/(?:u\/\d+\/)?folders\/[\w-]{10,}\/?$/ },
      {
        host: /^drive\.google\.com$/,
        path: /^\/(?:open|uc)$/,
        query: /(?:^|&)id=[\w-]{10,}(?:&|$)/,
      },
      {
        host: /^docs\.google\.com$/,
        path: /^\/(?:document|spreadsheets|presentation)\/d\/[\w-]{10,}(?:\/[\w-]*)?$/,
      },
    ],
    rest: true,
  },
  {
    // The links OneDrive's share dialog hands out: `1drv.ms/<kind>/c/<account>/<code>` since 2024,
    // `1drv.ms/<kind>/s!<code>` before; and the long addresses on `onedrive.live.com` with the
    // item's `id=` or `resid=` (the front page, `about` and the like have none).
    name: 'OneDrive',
    forms: [
      { host: /^1drv\.ms$/, path: /^\/[a-z]\/(?:s![\w-]+|c\/[0-9a-f]+\/[\w-]+)\/?$/i },
      {
        host: /^onedrive\.live\.com$/,
        path: /^\/(?:redir|redir\.aspx|download|embed)?$/,
        query: /(?:^|&)(?:res)?id=[^&]+/,
      },
    ],
    rest: true,
  },
  {
    // transferwee (the WeTransfer tool) names both: the short `we.tl/<code>` (today `t-<code>`)
    // and `wetransfer.com/downloads/<transfer>[/<recipient>]/<hash>`, also on a company's own
    // subdomain of `wetransfer.com`.
    name: 'WeTransfer',
    forms: [
      { host: /^we\.tl$/, path: /^\/(?:t-)?[a-z0-9]+\/?$/i },
      {
        host: /^(?:[a-z0-9-]+\.)?wetransfer\.com$/,
        path: /^\/downloads\/[a-z0-9]+(?:\/[a-z0-9]+){1,2}\/?$/i,
      },
    ],
    rest: true,
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
 * `www.` -- `swisstransfer.com/dl/…`, `dropbox.com/scl/fi/…/Bericht.pdf`. Not the query or the `#`
 * part: they carry the link's key, which the card keeps as its target and need not show.
 *
 * @param {string} url a link `fileLinkService` names a service for
 * @returns {string}
 */
export const fileLinkLabel = (url) => {
  const address = cut(url)
  return address ? `${address.host.replace(/^www\./, '')}${address.path}` : ''
}
