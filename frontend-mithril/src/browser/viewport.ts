// AI-GENERATED — not an architecture reference
import { LG_BREAKPOINT_PX } from '@frontend/constants'
import m from 'mithril'

// The width from which the layout shows its side columns (Bootstrap's `-lg-` in the wallet's
// styles). Below it the layout draws other parts, a decision CSS cannot make.
const desk = window.matchMedia(`(min-width: ${LG_BREAKPOINT_PX}px)`)
// TODO: check if mithril maybe update already by himself on media change
desk.addEventListener('change', () => m.redraw())

/** Whether the window is narrower than the boundary at which the side columns appear. */
export function isPhone() {
  return !desk.matches
}
