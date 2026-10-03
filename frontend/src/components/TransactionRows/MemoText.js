// AI-GENERATED — not an architecture reference
import { h } from 'vue'
import { memoParts } from '@/utils/memoParts'
import { chatSearchMarked, useChatSearchNeedle } from '@/components/Chat/chatSearchMarks'

// A link keeps its click to itself: the memo stands inside a booking row that opens and
// closes on a click, and following a link should not also do that.
const keepClick = (event) => event.stopPropagation()

/**
 * A memo as text, with its web and e-mail addresses as links (see `memoParts` for why it is
 * never handed to the page as markup).
 *
 * ⚠️ A render function rather than a template: the house formatter breaks lines around
 * inline elements, and Vue turns such a break into a space -- "see https://x.org." would come
 * out with a space before and after the link. Here the pieces are children of one element and
 * nothing stands between them.
 *
 * In a chat thread a transfer's memo is searched with the messages (E-057), and its hits are
 * marked; in the booking list nothing is searched, and nothing changes there.
 */
export default {
  name: 'MemoText',
  props: {
    memo: { type: String, default: '' },
  },
  setup(props) {
    const search = useChatSearchNeedle()
    return () => {
      const needle = search?.value ?? ''
      return h(
        'span',
        { class: 'memo-text' },
        memoParts(props.memo).flatMap((part) => {
          if (part.type === 'url') {
            return h(
              'a',
              {
                href: part.value,
                target: '_blank',
                rel: 'noopener noreferrer',
                onClick: keepClick,
              },
              chatSearchMarked(part.value, needle),
            )
          }
          if (part.type === 'email') {
            return h(
              'a',
              { href: `mailto:${part.value}`, onClick: keepClick },
              chatSearchMarked(part.value, needle),
            )
          }
          return chatSearchMarked(part.value, needle)
        }),
      )
    }
  },
}
