// AI-GENERATED — not an architecture reference
import { h, inject } from 'vue'
import { CHAT_SEARCH, chatSearchPieces } from '@/utils/chatSearch'

/**
 * What the thread searches for (useChatThreadSearch), for the words of its bubbles: a ref whose
 * value is '' while nothing is searched. None outside a thread -- a memo in the booking list, a
 * picture's caption in its own view -- and nothing is marked there.
 */
export const useChatSearchNeedle = () => inject(CHAT_SEARCH, null)

/**
 * A text with its hits marked (E-057): the pieces as children -- plain strings, and a `<mark>` for
 * each hit, which a screen reader reads as the text it is. The text as it is where nothing is
 * searched or the needle is not in it.
 *
 * @param {string} text
 * @param {string} needle as `chatSearchNeedle` makes it
 * @returns {string | Array<string | import('vue').VNode>}
 */
export const chatSearchMarked = (text, needle) => {
  if (!needle || !text) return text
  return chatSearchPieces(text, needle).map((piece) =>
    piece.hit ? h('mark', { class: 'chat-search-mark' }, piece.text) : piece.text,
  )
}

/**
 * A line of plain text with its hits marked -- a bubble's subject, the words over a transfer.
 * A render function, for the reason MemoText gives: nothing may stand between the pieces.
 */
export const ChatSearchText = {
  name: 'ChatSearchText',
  props: {
    text: { type: String, default: '' },
  },
  setup(props) {
    const needle = useChatSearchNeedle()
    return () => h('span', chatSearchMarked(props.text, needle?.value ?? ''))
  },
}
