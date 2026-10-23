// AI-GENERATED — not an architecture reference
import { CONTACT_META_SEPARATOR } from '@/components/Contacts/contactDisplay'
import { chatMarkdown } from '@/utils/chatMarkdown'
import { memberAlias } from '@/utils/gradidoAddress'

/** The words of the pieces of a line, without the signs that made them bold, a link or code. */
const inlineWords = (parts) =>
  parts.map((part) => (part.parts ? inlineWords(part.parts) : part.value)).join('')

/** The words of blocks, one after the other: headings, lists, quotes and tables without their signs. */
const blockWords = (blocks) =>
  blocks
    .map((block) => {
      switch (block.type) {
        case 'text':
        case 'heading':
          return inlineWords(block.inline)
        case 'code':
          return block.text
        case 'quote':
          return blockWords(block.blocks)
        case 'list':
          return block.items.map((item) => blockWords(item.blocks)).join(' ')
        case 'table':
          return [...block.head, ...block.rows.flat()].map(inlineWords).join(' ')
        default:
          // A rule says nothing.
          return ''
      }
    })
    .join(' ')

/**
 * The beginning of a message as the line under a name shows it (E-083, Bernd's choice "der Anfang
 * in einer Zeile"): read as the bubble reads it (chatMarkdown), so that the signs that make a word
 * bold or a line a heading do not stand in the line -- and every break, every run of spaces, made
 * one space, as the quotation over an answer has it. The wallet cuts it off where the line ends.
 *
 * @param {string} words the raw beginning the server sent (ChatPreview.excerpt)
 * @returns {string}
 */
export const chatPreviewWords = (words) =>
  blockWords(chatMarkdown(words ?? ''))
    .replace(/\s+/g, ' ')
    .trim()

/**
 * What the line under a name says (E-083): `{ by, text, picture }`.
 * - `by`: who it is from where that is to be said -- "Du" for one's own message or the Gradido one
 *   gave, in a group the writer the server named (as a group's message is named); '' otherwise.
 * - `text`: on a booking the Gradido and the memo ("20,00 GDD · Danke"), the amount as the thread
 *   writes it (ChatThread); on a message its words, and "Bild" for a picture without any.
 * - `picture`: whether the message carries a picture, for the sign in front of the words.
 *
 * `t` and `n` come from the caller's `useI18n()`: this file is not a setup scope.
 *
 * @param {{ mine: boolean, excerpt: string, hasImage: boolean, amount?: string | null,
 *   senderUser?: { alias: string | null, gradidoID: string } | null }} preview
 * @param {{ t: Function, n: Function }} i18n
 */
export const chatPreviewLine = (preview, { t, n }) => {
  const writer = preview.senderUser
  const by = preview.mine
    ? t('chatThread.you')
    : writer
      ? memberAlias(writer.alias, writer.gradidoID)
      : ''
  const words = chatPreviewWords(preview.excerpt)
  const booking = preview.amount !== null && preview.amount !== undefined
  const text = booking
    ? [`${n(Math.abs(Number(preview.amount)), 'decimal')} ${t('GDD')}`, words]
        .filter(Boolean)
        .join(CONTACT_META_SEPARATOR)
    : words || (preview.hasImage ? t('chatThread.imageReady') : '')
  return { by, text, picture: !booking && Boolean(preview.hasImage) }
}
