// AI-GENERATED — not an architecture reference
import m from 'mithril'

type Attrs = m.Attributes & {
  /** What the button starts. While the promise it returns is open, the button is locked. */
  onclick?: () => unknown
  /** Locked from outside: the button of a form, while the form is sending. */
  busy?: boolean
}

/**
 * A button for what the member starts (send, save): locked, with a small spinner, until the
 * answer is here -- a second click sends nothing twice. Every other attribute goes to the
 * button as it is.
 */
export class BusyButton implements m.ClassComponent<Attrs> {
  #busy = false

  view({ attrs: { onclick, busy = this.#busy, ...button }, children }: m.Vnode<Attrs>) {
    return m(
      'button.btn',
      {
        type: 'button',
        ...button,
        disabled: busy || button.disabled,
        onclick: async () => {
          this.#busy = true
          try {
            await onclick?.()
          } finally {
            this.#busy = false
            // Mithril redraws after a handler's promise only where it is fulfilled: after a
            // throw the button would stay locked
            m.redraw()
          }
        },
      },
      busy ? m('span.spinner-border.spinner-border-sm.me-2', { 'aria-hidden': 'true' }) : undefined,
      children,
    )
  }
}
