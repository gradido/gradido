// AI-GENERATED — not an architecture reference

/**
 * A step of the send page stands where another stood a moment ago, and the button that was pressed
 * is gone with it. So its heading takes the focus -- a screen reader then says what happened -- and
 * comes into the window where the window has moved past it.
 *
 * Up to 450 px the navbar stays at the top of the window, over whatever scrolls under it
 * (Menu/Navbar.vue): there the heading has to stand below the navbar's lower edge, as the form does
 * when an address asks for it (TransactionForm.vue). Its height is read, not written down a second
 * time -- it grows with the tools in it.
 *
 * @param {HTMLElement} heading with `tabindex="-1"`, to take the focus at all
 */
export const focusStepHeading = (heading) => {
  const bar = document.querySelector('.navbar-element')
  const stays = bar && getComputedStyle(bar).position === 'fixed'
  const room = stays ? Math.ceil(bar.getBoundingClientRect().bottom) : 0
  heading.focus({ preventScroll: true })
  const { top, bottom } = heading.getBoundingClientRect()
  if (top < room || bottom > window.innerHeight) {
    heading.style.scrollMarginTop = `${room}px`
    heading.scrollIntoView({ block: 'start' })
  }
}
