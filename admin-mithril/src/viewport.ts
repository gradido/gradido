// AI-GENERATED — not an architecture reference
import m from 'mithril'

// The width from which the tables stand as tables (`b-table-stacked-lg`); below it every row of
// the member search and the contribution page is a card, which needs other cells -- a decision
// CSS cannot make.
const DESK = window.matchMedia('(min-width: 992px)')
DESK.addEventListener('change', () => m.redraw())

/** Whether the window is narrower than the boundary at which the tables become cards. */
export const isPhone = () => !DESK.matches
