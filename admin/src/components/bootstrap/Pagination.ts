// AI-GENERATED — not an architecture reference
import m, { type ClassComponent, type Vnode } from 'mithril'
import './pagination.css'

interface Attrs {
  /** the page shown, from 1 */
  page: number
  pages: number
  onpage: (page: number) => void
  /** the id of what the buttons page through */
  controls?: string
  /** how many places for pages at most; 5 where not set */
  limit?: number
  /** without « and » */
  noEndButtons?: boolean
  /** classes of the list: its alignment, size and look */
  class?: string
}

/** One entry of the pagination: a page, an arrow to one, or an ellipsis. */
export type PageItem =
  | { kind: 'page'; page: number; smHidden: boolean }
  | { kind: 'arrow'; page: number; text: string; label: string; disabled: boolean }
  | { kind: 'ellipsis' }

const FIRST = -1
const PREV = -2
const NEXT = -3
const LAST = -4
const ELLIPSIS = -5

/**
 * The entries as bootstrap-vue-next's BPagination laid them out: the arrows to the first and the
 * previous page, `limit` places around the page shown -- an ellipsis taking the outer ones where
 * pages are left out, for a limit above 3 --, the arrows to the next and the last page. Like the
 * original, as many pages as places already show with an ellipsis.
 */
export const pageItems = (
  page: number,
  pages: number,
  limit = 5,
  endButtons = true,
): PageItem[] => {
  const half = Math.floor(limit / 2)
  const ellipsis = limit > 3
  const outer = endButtons ? 1 : 0
  let places: number[]
  if (pages < limit) {
    places = Array.from({ length: pages }, (_, index) => index + 1)
  } else {
    const start = page <= half ? 1 : page > pages - half ? pages - limit + 1 : page - half
    places = Array.from({ length: limit }, (_, index) => start + index)
    if (ellipsis && page > half) {
      places[0] = ELLIPSIS
    }
    if (ellipsis && page <= pages - half) {
      places[limit - 1] = ELLIPSIS
    }
  }
  const items: PageItem[] = places.map((place) =>
    place === ELLIPSIS ? { kind: 'ellipsis' } : { kind: 'page', page: place, smHidden: false },
  )
  // on a small screen the page farthest from the one shown gives way
  const smHidden = (index: number) => {
    const item = items[index]
    if (pages > 3 && item?.kind === 'page') {
      item.smHidden = true
    }
  }
  if (page > pages - half) {
    smHidden(1)
  }
  if (page <= half) {
    smHidden(items.length - 2)
  }
  const arrow = (kind: number): PageItem => {
    const [to, text, label] = {
      [FIRST]: [1, '«', 'Go to first page'],
      [PREV]: [page - 1, '‹', 'Go to previous page'],
      [NEXT]: [page + 1, '›', 'Go to next page'],
      [LAST]: [pages, '»', 'Go to last page'],
    }[kind] as [number, string, string]
    return {
      kind: 'arrow',
      page: Math.min(Math.max(to, 1), pages),
      text,
      label,
      disabled: to === page || to < 1 || to > pages,
    }
  }
  return [
    ...[FIRST, PREV].slice(1 - outer).map(arrow),
    ...items,
    ...[NEXT, LAST].slice(0, 1 + outer).map(arrow),
  ]
}

/** Bootstrap's pagination, as BPagination drew it. */
export class Pagination implements ClassComponent<Attrs> {
  view({ attrs }: Vnode<Attrs>) {
    const { page, pages, onpage, controls, limit, noEndButtons } = attrs
    const go = (to: number) => () => to !== page && onpage(to)
    return m(
      'ul.pagination',
      {
        class: attrs.class ?? 'justify-content-start',
        role: 'menubar',
        'aria-disabled': 'false',
        'aria-label': 'Pagination',
      },
      pageItems(page, pages, limit, !noEndButtons).map((item) => {
        if (item.kind === 'ellipsis') {
          return m(
            'li.page-item.disabled.text-center.bv-d-sm-down-none',
            { role: 'separator' },
            m('span.page-link', '…'),
          )
        }
        const button = { 'aria-controls': controls, role: 'menuitem' }
        if (item.kind === 'page') {
          const active = item.page === page
          return m(
            'li.page-item',
            { class: [active ? 'active' : '', item.smHidden ? 'bv-d-sm-down-none' : ''].join(' ') },
            m(
              'button.page-link.text-center',
              {
                ...button,
                type: 'button',
                'aria-label': `Go to page ${item.page}`,
                'aria-posinset': item.page,
                'aria-setsize': pages,
                tabindex: active ? '0' : '-1',
                onclick: go(item.page),
              },
              item.page,
            ),
          )
        }
        return m(
          'li.page-item',
          { class: item.disabled ? 'disabled' : '' },
          item.disabled
            ? m(
                'span.page-link.text-center',
                { ...button, 'aria-label': item.label, 'aria-disabled': 'true' },
                item.text,
              )
            : m(
                'button.page-link.text-center',
                {
                  ...button,
                  type: 'button',
                  'aria-label': item.label,
                  tabindex: '-1',
                  onclick: go(item.page),
                },
                item.text,
              ),
        )
      }),
    )
  }
}
