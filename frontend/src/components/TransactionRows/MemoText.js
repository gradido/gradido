// AI-GENERATED — not an architecture reference
import { h } from 'vue'
import { memoParts } from '@/utils/memoParts'

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
 */
export default {
  name: 'MemoText',
  props: {
    memo: { type: String, default: '' },
  },
  setup(props) {
    return () =>
      h(
        'span',
        { class: 'memo-text' },
        memoParts(props.memo).map((part) => {
          if (part.type === 'url') {
            return h(
              'a',
              {
                href: part.value,
                target: '_blank',
                rel: 'noopener noreferrer',
                onClick: keepClick,
              },
              part.value,
            )
          }
          if (part.type === 'email') {
            return h('a', { href: `mailto:${part.value}`, onClick: keepClick }, part.value)
          }
          return part.value
        }),
      )
  },
}
