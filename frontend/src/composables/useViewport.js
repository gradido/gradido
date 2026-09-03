// AI-GENERATED — not an architecture reference

import { readonly, ref } from 'vue'
import { LG_BREAKPOINT_PX } from '@/constants'

/**
 * Which side of this wallet's one layout boundary the window is on.
 *
 * The layout carries some panels twice -- once above the page for a phone, once beside it
 * for a desk -- and until now only CSS decided which of the two a member sees. Both were
 * mounted at every width, so a phone built, decorated and FETCHED for a column behind
 * `display:none`. That was tolerable while the hidden twin only rendered; the contacts
 * column asks the server, and a request for something nobody can see is not.
 *
 * ⛔ The boundary is `LG_BREAKPOINT_PX`, and it is a copy of a number that lives in SCSS --
 * see the note there, and the drift spec beside this file that measures the two against
 * each other in the COMPILED stylesheet. Writing Bootstrap's default 992 here, which an
 * earlier version did while claiming to be reading the layout's own value, left a band of
 * 33 pixels in which no column rendered at all.
 *
 * ★ THREE states. Where the browser cannot be asked, the answer is `unknown` and the layout
 * mounts both columns exactly as it did before -- nothing can vanish because a media query
 * was unavailable, and the CSS classes stay in place as the second lock either way.
 */
const BREAKPOINT = `(min-width: ${LG_BREAKPOINT_PX}px)`

const viewport = ref('unknown')

let media = null
let onChange = null

const apply = (matches) => {
  viewport.value = matches ? 'desktop' : 'mobile'
}

const listen = () => {
  if (media) return
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

  const query = window.matchMedia(BREAKPOINT)
  onChange = (event) => apply(event.matches)

  /**
   * ⛔ Both spellings, and the check is on the METHOD, not on `matchMedia`. Safari 14 and
   * iOS 14 brought `MediaQueryList.addEventListener`; before them there is only the
   * deprecated `addListener`. An unguarded call throws, and this composable is a bare
   * statement in the layout's `setup()` -- so the throw would abort setup and leave the
   * whole wallet blank on those devices, which is the opposite of the fallback this file
   * promises. Where neither exists the value is read once and simply never updates; a
   * window that is not resized is the common case anyway.
   */
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', onChange)
  } else if (typeof query.addListener === 'function') {
    query.addListener(onChange)
  } else {
    onChange = null
  }

  media = query
  apply(query.matches)
}

/**
 * @returns {import('vue').Ref<'desktop'|'mobile'|'unknown'>}
 */
export const useViewport = () => {
  listen()
  return readonly(viewport)
}

/**
 * Detaches the query and forgets the answer.
 *
 * ⛔ Removes the listener rather than only dropping the handle. Called repeatedly -- which
 * is what a spec does around a stubbed `matchMedia` -- the old shape left one live closure
 * per call, each still writing into this one module ref, so the last registration to fire
 * won and the value could belong to a finished test.
 */
export const forgetViewport = () => {
  if (media && onChange) {
    if (typeof media.removeEventListener === 'function') {
      media.removeEventListener('change', onChange)
    } else if (typeof media.removeListener === 'function') {
      media.removeListener(onChange)
    }
  }
  media = null
  onChange = null
  viewport.value = 'unknown'
}
