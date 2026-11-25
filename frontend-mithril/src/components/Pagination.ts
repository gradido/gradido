// AI-GENERATED — not an architecture reference
import m from 'mithril'
import { t } from '@/i18n'

type Attrs = {
  /** the page shown, from 1 */
  page: number
  pages: number
  onpage: (page: number) => void
  /** how many places for pages at most */
  limit: number
  class?: string
}

/**
 * The wallet's pager: round buttons for the pages around the one shown, between ‹ and ›. To a
 * screen reader a menubar (WAI-ARIA), as bootstrap-vue-next drew it, with what that left out:
 * the list items are no part of it, the page shown says `aria-current`, and an arrow that
 * leads nowhere is still reached by the keys.
 */
export class Pagination implements m.ClassComponent<Attrs> {
  /**
   * The pages a pager of `limit` places shows around `page`, as bootstrap-vue-next laid them
   * out: `page` in the middle where the ends allow it. On a small screen (`smHidden`) the page
   * second from the far end gives way, once the pager stands at an end of more than three pages.
   */
  #pagesShown(page: number, pages: number, limit: number) {
    const half = Math.floor(limit / 2)
    const places = Math.min(limit, pages)
    const first = page <= half ? 1 : page > pages - half ? pages - places + 1 : page - half
    return Array.from({ length: places }, (_, index) => ({
      page: first + index,
      smHidden:
        // never the page shown: with two places it stands where the one to hide would
        first + index !== page &&
        pages > 3 &&
        ((page > pages - half && index === 1) || (page <= half && index === places - 2)),
    }))
  }

  // The keys of a menubar (WAI-ARIA): ← and → move the focus to the entry before or after,
  // Home and End to the first and the last. Only the page shown is in the tab order.
  #moveFocus(event: KeyboardEvent & { currentTarget: Element; redraw?: boolean }) {
    // nothing changes but the focus
    event.redraw = false
    // without those a small screen hides
    const buttons = [
      ...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ].filter((button) => button.offsetParent !== null)
    const at = buttons.findIndex((button) => button === document.activeElement)
    const to = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: buttons.length - 1 }[
      event.key
    ]
    if (at >= 0 && to !== undefined) {
      event.preventDefault()
      buttons[Math.min(Math.max(to, 0), buttons.length - 1)].focus()
    }
  }

  // The focus stays with the pager where a draw takes away what had it: an arrow that led to
  // the last page leads nowhere now, and is no button any more. It goes to the page shown.
  #hadFocus = false

  onbeforeupdate(_vnode: m.Vnode<Attrs>, old: m.VnodeDOM<Attrs>) {
    this.#hadFocus = old.dom.contains(document.activeElement)
  }

  onupdate({ dom }: m.VnodeDOM<Attrs>) {
    if (this.#hadFocus && !dom.contains(document.activeElement)) {
      dom.querySelector<HTMLElement>('[aria-current]')?.focus()
    }
  }

  view({ attrs: { page, pages, onpage, limit, class: classes } }: m.Vnode<Attrs>) {
    const arrow = (to: number, text: string, label: string) =>
      to < 1 || to > pages
        ? m(
            'li.page-item.disabled',
            { role: 'none' },
            m(
              'span.page-link.text-center',
              { role: 'menuitem', 'aria-label': label, 'aria-disabled': 'true', tabindex: -1 },
              text,
            ),
          )
        : m(
            'li.page-item',
            { role: 'none' },
            m(
              'button.page-link.text-center',
              {
                type: 'button',
                role: 'menuitem',
                'aria-label': label,
                tabindex: -1,
                onclick: () => onpage(to),
              },
              text,
            ),
          )
    return m(
      'ul.pagination.justify-content-center.pagination-lg.b-pagination-pills',
      {
        class: classes,
        role: 'menubar',
        'aria-disabled': 'false',
        'aria-label': t('pagination.label'),
        onkeydown: this.#moveFocus,
      },
      arrow(page - 1, '‹', t('pagination.previous')),
      this.#pagesShown(page, pages, limit).map((shown) =>
        m(
          'li.page-item',
          {
            // by its page: as the pages shown move on, a button keeps its page and its focus
            key: shown.page,
            role: 'none',
            class: `${shown.page === page ? 'active' : ''} ${shown.smHidden ? 'bv-d-sm-down-none' : ''}`,
          },
          m(
            'button.page-link.text-center',
            {
              type: 'button',
              role: 'menuitem',
              'aria-label': t('pagination.page', { page: shown.page }),
              'aria-current': shown.page === page ? 'page' : undefined,
              'aria-posinset': shown.page,
              'aria-setsize': pages,
              tabindex: shown.page === page ? 0 : -1,
              onclick: () => shown.page !== page && onpage(shown.page),
            },
            shown.page,
          ),
        ),
      ),
      arrow(page + 1, '›', t('pagination.next')),
    )
  }
}
