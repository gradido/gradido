// AI-GENERATED — not an architecture reference
import { type DeepReadonly, type Ref, readonly, ref } from 'vue'
import { PHONE_BREAKPOINT_PX } from '@/constants'

/**
 * Which side of this interface's phone boundary the window is on.
 *
 * Below it the contribution page draws every row as a card: the table hands the stacked rows
 * other cells than at the desk, and that is a decision JavaScript has to make -- CSS can stack
 * the cells, it cannot choose them. Everything else about the phone stays in CSS.
 *
 * ⛔ The boundary is `PHONE_BREAKPOINT_PX`, a copy of the width at which the stylesheets stack
 * the tables. The drift spec beside this file measures the two against each other; a card
 * drawn into a table that does not stack, or the other way round, is what a wrong number here
 * would cost.
 *
 * ★ THREE states, as in the wallet (frontend/src/composables/useViewport.js). Where the browser
 * cannot be asked the answer is `unknown`, and everything built on this behaves as at the
 * desk: nothing may change because a media query was unavailable.
 */
export type Viewport = 'desktop' | 'mobile' | 'unknown'

type MediaListener = (event: { matches: boolean }) => void

const BREAKPOINT = `(min-width: ${PHONE_BREAKPOINT_PX}px)`

const viewport = ref<Viewport>('unknown')

let media: MediaQueryList | null = null
let onChange: MediaListener | null = null

const apply = (matches: boolean) => {
  viewport.value = matches ? 'desktop' : 'mobile'
}

const listen = () => {
  if (media) {
    return
  }
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }

  const query = window.matchMedia(BREAKPOINT)
  const handler: MediaListener = (event) => apply(event.matches)
  onChange = handler

  // ⛔ Both spellings, and the check is on the METHOD, not on `matchMedia`: Safari and iOS
  // before 14 have only the deprecated `addListener`, and an unguarded call throws in the
  // `setup()` of the page that asks -- the whole page would stay blank. Where neither exists
  // the value is read once and simply never updates.
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handler)
  } else if (typeof query.addListener === 'function') {
    query.addListener(handler)
  } else {
    onChange = null
  }

  media = query
  apply(query.matches)
}

export const useViewport = (): DeepReadonly<Ref<Viewport>> => {
  listen()
  return readonly(viewport)
}

/**
 * Detaches the query and forgets the answer -- for a spec that stubs `matchMedia`.
 *
 * ⛔ Removes the listener rather than only dropping the handle: called repeatedly, the old
 * shape in the wallet left one live closure per call, each still writing into this one ref.
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
