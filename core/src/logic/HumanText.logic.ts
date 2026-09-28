// AI-GENERATED — not an architecture reference

/**
 * Text a person typed, cut into the pieces a mail shows: plain text, web addresses, e-mail
 * addresses and, where asked for, bold runs -- so that the addresses can be links WITHOUT the
 * text ever being read as markup.
 *
 * ⛔ The text is somebody else's: a chat message, a moderator's question, the memo of a
 * booking. Nothing here builds HTML. The mail template
 * (`emails/templates/includes/humanText.pug`) writes every piece through pug's escaping, as
 * text or as an attribute value, so whatever markup the text carries reaches the mail as text.
 *
 * The rules are the wallet's (`frontend/src/utils/memoParts.js`), so an address is a link in
 * the mail exactly where it is one in the wallet: web addresses only with http, https or ftp --
 * never `javascript:` --, e-mail addresses looked for only BETWEEN web addresses. The link text
 * is always the address itself: nobody can put a harmless word on a link to somewhere else. The
 * one shortening is the wallet's too: a video invitation of Gradido's own form shows its room
 * without the addition after the `#` (`OWN_VIDEO_ADDITION`) -- still the start of the address
 * itself, the server and the room it leads to.
 * `**…**` is bold as in the wallet's thread (`frontend/src/utils/chatTextParts.js`, the moderator
 * thread's `ParseMessage.vue`): across line breaks, the shortest run, the stars dropped, and
 * looked for only in the plain text between the addresses, so a pair never reaches across a
 * link. `HumanText.logic.test.ts` holds the patterns to the wallet's.
 */
export type HumanTextPart = {
  type: 'text' | 'bold' | 'url' | 'email'
  value: string
  /** A web address's text where it is not the whole address (`OWN_VIDEO_ADDITION`). */
  shown?: string
}

export const URL_PATTERN = /\b(?:https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]/gi
export const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
export const BOLD_PATTERN = /\*\*([\s\S]+?)\*\*/g

/**
 * The addition a Gradido wallet puts after the address of a video room: `#config.subject=` and
 * the topic (V4a), for a planned call its start and end as well (V5b). The wallet's thread shows
 * the room without it (`withoutChatVideoTopic`, `frontend/src/utils/chatVideoTopic.js`), and so
 * does the mail. With it the link is three times as long, reads `%22Videoanruf%22&gradido.start=…`,
 * and has no place where a mail client may break the line: it ran out of the card (Bernd,
 * 27.09.2026). The link itself keeps it, so Jitsi still gets the topic.
 *
 * ⛔ The wallet's rule, and `HumanText.logic.test.ts` holds it to the wallet's: exactly one `#`,
 * the topic's value without `&` and `#`, the time in 1 to 12 digits or not at all. Anything else
 * after a `#` is somebody else's address, and shows whole.
 */
const SCHEDULE = '&gradido\\.start=(\\d{1,12})&gradido\\.end=(\\d{1,12})'
const OWN_VIDEO_ADDITION = new RegExp(`^([^#]*)#config\\.subject=([^&#]*)(?:${SCHEDULE})?$`)

/** A web address as a part: shown as its room where it is a video invitation of our own form. */
const webAddress = (address: string): HumanTextPart => {
  const room = OWN_VIDEO_ADDITION.exec(address)?.[1]
  return room ? { type: 'url', value: address, shown: room } : { type: 'url', value: address }
}

/**
 * Cuts `text` at every match of `pattern`: a match becomes the part `found` makes of it, what
 * lies between goes through `between`.
 */
const cut = (
  text: string,
  pattern: RegExp,
  found: (match: RegExpMatchArray) => HumanTextPart,
  between: (text: string) => HumanTextPart[],
): HumanTextPart[] => {
  const parts: HumanTextPart[] = []
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) {
      parts.push(...between(text.slice(last, index)))
    }
    parts.push(found(match))
    last = index + match[0].length
  }
  if (last < text.length) {
    parts.push(...between(text.slice(last)))
  }
  return parts
}

const plain = (text: string): HumanTextPart[] => [{ type: 'text', value: text }]

const boldOrPlain = (text: string): HumanTextPart[] =>
  cut(text, BOLD_PATTERN, (match) => ({ type: 'bold', value: match[1] }), plain)

/**
 * Nothing for null or undefined: a mail without a memo shows no memo, not "undefined".
 * `bold` where the wallet shows bold: a chat message and a moderator's message. A memo keeps
 * its stars, as it does in the wallet.
 */
export const humanTextParts = (
  text: unknown,
  { bold = false }: { bold?: boolean } = {},
): HumanTextPart[] =>
  cut(
    text === null || text === undefined ? '' : String(text),
    URL_PATTERN,
    (match) => webAddress(match[0]),
    (between) =>
      cut(
        between,
        EMAIL_PATTERN,
        (match) => ({ type: 'email', value: match[0] }),
        bold ? boldOrPlain : plain,
      ),
  )
