// AI-GENERATED — not an architecture reference

import { readonly, ref } from 'vue'

/**
 * Whether the window is narrower than Bootstrap's `sm` (576 px) -- where BModal's
 * `fullscreen="sm"` makes a chat window a sheet over the whole screen, and where the stylesheets'
 * `(width <= 575.98px)` applies (the build writes it as this `max-width`). For what a stylesheet
 * cannot decide: a size a component is handed, as the face over a message in a group on a phone
 * (ChatBubble, Bernd 16.11.2026).
 *
 * One query for every caller, as `useViewport` keeps one for the layout boundary: a thread holds a
 * few hundred bubbles. Where the browser cannot be asked, false -- the desk form, as everything on
 * `useViewport` keeps it.
 */
export const SHEET_QUERY = '(max-width: 575.98px)'

const sheet = ref(false)

let media = null
let onChange = null

const listen = () => {
  if (media || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  media = window.matchMedia(SHEET_QUERY)
  onChange = (event) => {
    sheet.value = event.matches
  }
  // Both spellings, as in useViewport: before Safari 14 there is only `addListener`.
  if (typeof media.addEventListener === 'function') media.addEventListener('change', onChange)
  else if (typeof media.addListener === 'function') media.addListener(onChange)
  sheet.value = media.matches === true
}

/** @returns {import('vue').Ref<boolean>} */
export const useSheet = () => {
  listen()
  return readonly(sheet)
}

/** Detaches the query and forgets the answer -- for specs around a stubbed `matchMedia`. */
export const forgetSheet = () => {
  if (media && onChange) {
    if (typeof media.removeEventListener === 'function') {
      media.removeEventListener('change', onChange)
    } else if (typeof media.removeListener === 'function') {
      media.removeListener(onChange)
    }
  }
  media = null
  onChange = null
  sheet.value = false
}
