// AI-GENERATED — not an architecture reference
import { computed, h, inject } from 'vue'
import ChatFileCard from '@/components/Chat/ChatFileCard.vue'
import ChatVideoLinkCopy from '@/components/Chat/ChatVideoLinkCopy.vue'
import { chatSearchMarked, useChatSearchNeedle } from '@/components/Chat/chatSearchMarks'
import { fileLinkService } from '@/utils/chatFileLink'
import { chatMarkdown, isPlainChatText } from '@/utils/chatMarkdown'
import '@/components/Chat/chatMarkdown.scss'
import { CHAT_VIDEO_JOIN, chatVideoAppUrl, offersJitsiApp } from '@/utils/chatVideoApp'
import { withoutChatVideoTopic } from '@/utils/chatVideoTopic'

/** A click that opens a link where it stands: no key held, the main button. The others -- a new
 * tab, a new window, a download -- are the browser's, and they go as they always did. */
const plainClick = (event) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

/**
 * A piece that the thread shows as a file card: a link to files on SwissTransfer (E-044), or on
 * Dropbox, Google Drive, OneDrive or WeTransfer (Bernd, 27.09.2026).
 */
const isFileCard = (part) => part?.type === 'url' && fileLinkService(part.value) !== null

/**
 * The space right before and right after a file card, left out of what is shown. The card is a
 * block in the text, and the bubble keeps a message's own line breaks (`pre-wrap`): a break
 * between the card and the text after it would stand as an empty line under the card, a blank
 * line before it as one over it. What is stored stays as it was written.
 */
const aroundFileCards = (parts) =>
  parts
    .map((part, index) => {
      if (part.type !== 'text') return part
      let value = part.value
      if (isFileCard(parts[index - 1])) value = value.replace(/^\s+/, '')
      if (isFileCard(parts[index + 1])) value = value.replace(/\s+$/, '')
      return { ...part, value }
    })
    .filter((part) => part.type !== 'text' || part.value !== '')

/**
 * Whether the words of a link name `where` -- a host, or the address a mail goes to -- as a word
 * of its own: with a scheme before it or a path behind it, but not as a part of a longer name.
 * "bank.example" does not name "ank.example", and "bank.example.elsewhere.example" names neither.
 */
const wordsName = (words, where) =>
  words
    .toLowerCase()
    .split(/[\s<>()[\]{}"'„“”‚‘’«»]+/)
    .map((word) =>
      word
        .replace(/^[a-z][a-z0-9+.-]*:(?:\/\/)?/, '')
        .replace(/[/?#].*$/, '')
        .replace(/[.,;:!?…]+$/, ''),
    )
    .includes(where.toLowerCase())

/** Where a link with words leads, to be said beside the words; null where the words say it. */
const linkLeadsTo = (href, words) => {
  let where
  try {
    const address = new URL(href)
    where = address.protocol === 'mailto:' ? address.pathname : address.host
  } catch {
    return null
  }
  return where && !wordsName(words, where) ? where : null
}

/** The words of a run of pieces, as they are shown. */
const wordsOf = (parts) =>
  parts.map((part) => (part.parts ? wordsOf(part.parts) : (part.value ?? ''))).join('')

/** A message's headings stand under the thread's own: a day's date there is an `h3`. */
const HEADING_TAGS = ['h4', 'h5', 'h6', 'h6', 'h6', 'h6']

/**
 * The text of one chat message, read as Markdown (E-078, utils/chatMarkdown): headings, lists,
 * quotations, tables and code, emphasis, and its web and e-mail addresses as links. A message
 * that is no Markdown is one `<span>` with its words and its links in it, as it always was.
 *
 * ⛔ Every piece is built with h() and reaches the page as text or as an attribute value --
 * never as markup, because the text comes from the other side of the conversation (see
 * chatMarkdown). No `v-html`, no `innerHTML`. A link with words leads only where chatMarkdown
 * lets a link lead (http, https, ftp, mailto), and it SAYS where: the words are the other
 * side's too, and "your bank" over another address is the oldest trick there is -- so the
 * address's host stands behind the words, unless the words name it. A picture is never fetched.
 *
 * ⚠️ A render function rather than a template, for the reason MemoText gives: the house
 * formatter breaks lines around inline elements, and Vue turns such a break into a space.
 * Here it would even be SHOWN -- the bubble keeps the message's own line breaks and spaces
 * (`white-space: pre-wrap`), so a break the formatter put in would stand in the text.
 *
 * A video room's link SHOWS its server and room only (V4a): the topic's encoded addition after
 * `#` says nothing to anybody, and the invitation names the topic in words above it. The link
 * itself keeps the whole address -- the addition is what gives the meeting its title. Only that
 * one addition is left out of sight (`withoutChatVideoTopic`); every other address is shown as it
 * is. The thread only: memos and mails show addresses whole.
 *
 * Behind such a link -- the ones shown shorter than they are -- a button copies it (Bernd,
 * 29.09.2026, ChatVideoLinkCopy): the room with its topic, for another chat or another day. In
 * every bubble that carries one, one's own and the others', in a conversation of two as in a
 * group. An address from elsewhere (a Jitsi room pasted in, a Zoom link) is shown whole and copied
 * as any link is.
 *
 * On a computer a click on the link of an invitation of our own asks first (V4b, Bernd,
 * 26.09.2026): "Join call", with the box "Start in the Jitsi app" under it -- the question the
 * contact window provides (`CHAT_VIDEO_JOIN`), in the sender's own bubble too. The link itself
 * stays the room's address, so a click with a key held, the middle button and "copy link" work as
 * on any link. On a phone, and where no window provides the question, it opens the room straight
 * away, as it always did. Whether this is a computer is asked at the click, nothing kept.
 *
 * Searched for in the thread (E-057), the hits are marked where they stand -- in the words,
 * emphasised or not, in code and in the addresses as shown; a file card is a card, not words, and
 * stays as it is. The search itself reads the message as it was typed.
 *
 * A link to files on SwissTransfer, Dropbox, Google Drive, OneDrive or WeTransfer is shown as a
 * file card in place of the address (Paket D, E-044): Gradido stores no files, the message
 * carries the link, and the card names the service and where it leads. The words around it stay;
 * every other address stays a link, as before. A card stands in a stretch of text only -- in a
 * heading, a table or an emphasised run the address is a link like any other.
 */
export default {
  name: 'ChatMessageText',
  props: {
    text: { type: String, default: '' },
  },
  setup(props) {
    const join = inject(CHAT_VIDEO_JOIN, null)
    const search = useChatSearchNeedle()
    // Read once for a text, not at every picture: the search marks its hits by drawing anew.
    const blocks = computed(() => chatMarkdown(props.text))

    return () => {
      const needle = search?.value ?? ''
      const marked = (text) => chatSearchMarked(text, needle)

      const address = (part) => {
        const shown = withoutChatVideoTopic(part.value)
        const video = shown !== part.value
        const asks = join && chatVideoAppUrl(part.value) !== null
        const link = h(
          'a',
          {
            ...(video ? { class: 'chat-video-link' } : {}),
            href: part.value,
            target: '_blank',
            rel: 'noopener noreferrer',
            ...(asks
              ? {
                  onClick: (event) => {
                    if (!plainClick(event) || !offersJitsiApp()) return
                    event.preventDefault()
                    join(part.value)
                  },
                }
              : {}),
          },
          marked(shown),
        )
        // Right behind the link, in the room it keeps at its end (ChatVideoLinkCopy).
        return video ? [link, h(ChatVideoLinkCopy, { href: part.value })] : link
      }

      /** The pieces of a line; `cards`: a link to files is shown as its card (a stretch of text). */
      const inline = (parts, cards = false) =>
        (cards ? aroundFileCards(parts) : parts).flatMap((part) => {
          switch (part.type) {
            case 'url':
              return cards && isFileCard(part)
                ? h(ChatFileCard, { href: part.value, service: fileLinkService(part.value) })
                : address(part)
            case 'email':
              return h('a', { href: `mailto:${part.value}` }, marked(part.value))
            case 'bold':
              return h('strong', inline(part.parts))
            case 'italic':
              return h('em', inline(part.parts))
            case 'strike':
              return h('s', inline(part.parts))
            case 'code':
              return h('code', { class: 'chat-md-code' }, marked(part.value))
            case 'link': {
              const where = linkLeadsTo(part.href, wordsOf(part.parts))
              const link = h(
                'a',
                { href: part.href, target: '_blank', rel: 'noopener noreferrer' },
                inline(part.parts),
              )
              return where
                ? [link, h('span', { class: 'chat-md-link-where' }, ` (${where})`)]
                : link
            }
            default:
              return marked(part.value)
          }
        })

      /** What stands in a list's entry: its first words in the entry's own line. */
      const entry = ([first, ...rest]) =>
        first?.type === 'text'
          ? [...inline(first.inline, true), ...rest.map(block)]
          : [first, ...rest].filter(Boolean).map(block)

      const block = (part) => {
        switch (part.type) {
          case 'heading':
            return h(
              HEADING_TAGS[part.level - 1],
              { class: `chat-md-heading chat-md-heading-${part.level}` },
              inline(part.inline),
            )
          case 'code':
            // What stood behind the opening fence stands over the code: the name of its language,
            // mostly -- and where somebody wrote words there, they are not left out.
            return h('pre', { class: 'chat-md-pre' }, [
              ...(part.lang ? [h('span', { class: 'chat-md-pre-lang' }, marked(part.lang))] : []),
              h('code', marked(part.text)),
            ])
          case 'quote':
            return h('blockquote', { class: 'chat-md-quote' }, part.blocks.map(block))
          case 'rule':
            return h('hr', { class: 'chat-md-rule' })
          case 'list':
            return h(
              part.ordered ? 'ol' : 'ul',
              { class: 'chat-md-list' },
              part.items.map((item) =>
                h(
                  'li',
                  {
                    // The number as it was typed: a list that begins at 3 begins at 3.
                    ...(part.ordered ? { value: item.number } : {}),
                    ...(item.task === null ? {} : { class: 'chat-md-task' }),
                  },
                  [
                    // A box as the browser draws one, for nobody to tick: a screen reader says
                    // "ticked" or "not ticked" in the reader's own language, which a sign would
                    // not. Out of use for the ear (`aria-disabled`) and for the keyboard, but not
                    // `disabled`: that draws it pale, and a ticked box was hard to tell from an
                    // empty one on a light bubble.
                    ...(item.task === null
                      ? []
                      : [
                          h('input', {
                            class: 'chat-md-box',
                            type: 'checkbox',
                            checked: item.task,
                            'aria-disabled': 'true',
                            tabindex: '-1',
                            onClick: (event) => event.preventDefault(),
                          }),
                        ]),
                    ...entry(item.blocks),
                  ],
                ),
              ),
            )
          case 'table': {
            const cell = (tag) => (words, column) =>
              h(
                tag,
                {
                  ...(tag === 'th' ? { scope: 'col' } : {}),
                  ...(part.align[column] ? { class: `chat-md-cell-${part.align[column]}` } : {}),
                },
                inline(words),
              )
            // The table scrolls sideways in a box of its own, where it is wider than the bubble:
            // reachable by keyboard, so the keyboard can scroll it.
            return h(
              'div',
              { class: 'chat-md-table-box', tabindex: '0' },
              h('table', { class: 'chat-md-table' }, [
                h('thead', h('tr', part.head.map(cell('th')))),
                h(
                  'tbody',
                  part.rows.map((row) => h('tr', row.map(cell('td')))),
                ),
              ]),
            )
          }
          default:
            return h('div', { class: 'chat-md-text' }, inline(part.inline, true))
        }
      }

      const read = blocks.value
      if (read.length === 0 || isPlainChatText(read)) {
        return h('span', { class: 'chat-message-text' }, inline(read[0]?.inline ?? [], true))
      }
      return h('div', { class: 'chat-message-text chat-md' }, read.map(block))
    }
  },
}
