// AI-GENERATED — not an architecture reference

import { computed } from 'vue'
import { useViewport } from '@/composables/useViewport'

/**
 * How much of itself a page pager shows, by the side of the layout boundary the window is on.
 *
 * Every pager in this wallet is a `size="lg"` pill pager: about 65px for a page number, 76px
 * from two digits on, 61px for an arrow. With `no-ellipsis` and the five numbers of
 * bootstrap-vue-next's default `limit`, the booking list's pager was 508 to 629px wide on a
 * 390px phone (measured 25.09.2026 at 12 and 120 pages), and `.pagination` is a flex row that
 * does not wrap: it hung out of the page on both sides and the clip in App.vue cut it off.
 *
 * On a phone it shows three numbers, as the contacts page has since 04.09.2026, and no « and
 * » (Bernd, 25.09.2026). `‹` and `›` and the numbers still reach every page. Below 576px
 * App.vue keeps all three numbers visible and narrows the pills; measured with both, the
 * pager is 233px at page 1 and 265px with two-digit numbers, one line from 320px up.
 * Whatever is still wider than the page takes a second line: every pager carries
 * `flex-wrap` for that.
 *
 * ⚠️ `unknown` -- no matchMedia -- keeps the desk form, as everything on `useViewport` does:
 * nothing changes where the browser cannot be asked.
 */
export const PHONE_PAGER_LIMIT = 3

/**
 * @param {number} deskLimit the page numbers the pager shows at the desk (5 is the library's
 *   default; the contacts page, 450px wide on every screen, shows 3)
 */
export const usePagerFit = (deskLimit = 5) => {
  const viewport = useViewport()
  const phone = computed(() => viewport.value === 'mobile')
  return {
    pagerLimit: computed(() => (phone.value ? PHONE_PAGER_LIMIT : deskLimit)),
    pagerNoEnds: phone,
  }
}
