// AI-GENERATED — not an architecture reference
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
export const chatPreviewWords = (words) => {
  const oneLine = (text) => text.replace(/\s+/g, ' ').trim()
  // A message of signs alone ("---", which the bubble draws as a rule) still said something: its
  // signs stand in the line, rather than an empty line under the name.
  return oneLine(blockWords(chatMarkdown(words ?? ''))) || oneLine(words ?? '')
}

/**
 * What the line under a name says (E-083), in its pieces: `{ by, label, words, picture }`.
 * - `by`: who it is from where that is to be said -- "Du" for one's own message or the Gradido one
 *   gave, in a group the writer the server named (as a group's message is named); '' otherwise.
 * - `label`: what the line says of its own -- on a booking the Gradido, as the thread writes them
 *   (ChatThread), and "Bild" for a picture without words; '' otherwise.
 * - `words`: what somebody wrote -- a message's words, a booking's memo; '' where there are none.
 *   The line sets them, and only them, in italics, as both booking lists set a memo (Bernd,
 *   24.10.2026).
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
  const label = booking
    ? `${n(Math.abs(Number(preview.amount)), 'decimal')} ${t('GDD')}`
    : !words && preview.hasImage
      ? t('chatThread.imageReady')
      : ''
  return { by, label, words, picture: !booking && Boolean(preview.hasImage) }
}
