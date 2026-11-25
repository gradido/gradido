import m from 'mithril'

interface Attrs {
  /** what the button shows */
  buttonContent: m.Children
  /** classes of the button beside `btn` and `dropdown-toggle`: its colour and size */
  buttonClass?: string
  menuClass?: string
  /** classes of the dropdown itself */
  class?: string
  'data-test'?: string
  /** the button's name, where what it shows is no text */
  label?: string
  disabled?: boolean
  /** hangs the menu from the right end of the button, not the left */
  end?: boolean
  /** the menu opens below the button also where the room there is short */
  noFlip?: boolean
}

/**
 * A Bootstrap dropdown; `children` are the entries of its menu (`li > button.dropdown-item`).
 * It closes on a choice, on Escape and on a click beside it, and the focus goes back to the
 * button. The menu opens below the button, or above it where the window has more room
 * there and the menu does not fit below; it is never higher than the room it opens into.
 */
export class Dropdown implements m.ClassComponent<Attrs> {
  #open = false
  #dom?: Element

  readonly #close = () => {
    this.#open = false
    this.#dom?.querySelector<HTMLElement>('.dropdown-toggle')?.focus()
    document.removeEventListener('click', this.#closeBeside, true)
    document.removeEventListener('keydown', this.#closeOnEscape)
  }

  // listeners on the document, outside of Mithril's handlers: they redraw themselves
  readonly #closeBeside = (event: MouseEvent) => {
    if (event.target instanceof Node && !this.#dom?.contains(event.target)) {
      this.#close()
      m.redraw()
    }
  }

  readonly #closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.#close()
      m.redraw()
    }
  }

  oncreate({ dom }: m.VnodeDOM<Attrs>) {
    this.#dom = dom
  }

  // After the draw and before the paint: an open menu can be measured, and is never seen in
  // the wrong place. The view leaves `top`, `bottom` and `maxHeight` alone, so they stay.
  onupdate({ dom, attrs }: m.VnodeDOM<Attrs>) {
    const menu = dom.querySelector<HTMLElement>('.dropdown-menu')
    if (!this.#open || !menu) {
      return
    }
    menu.style.maxHeight = ''
    const button = dom.getBoundingClientRect()
    const below = window.innerHeight - button.bottom
    const up = !attrs.noFlip && menu.offsetHeight > below && button.top > below
    menu.style.top = up ? 'auto' : '100%'
    menu.style.bottom = up ? '100%' : 'auto'
    menu.style.maxHeight = `${up ? button.top : below}px`
  }

  onremove() {
    document.removeEventListener('click', this.#closeBeside, true)
    document.removeEventListener('keydown', this.#closeOnEscape)
  }

  view({ attrs, children }: m.Vnode<Attrs>) {
    const show = this.#open ? 'show' : ''
    return m('.dropdown', { class: attrs.class, 'data-test': attrs['data-test'] }, [
      m(
        'button.btn.dropdown-toggle',
        {
          type: 'button',
          class: `${attrs.buttonClass ?? 'btn-md btn-secondary'} ${show}`,
          disabled: attrs.disabled,
          'aria-label': attrs.label,
          'aria-expanded': String(this.#open),
          'aria-haspopup': 'menu',
          onclick: () => {
            if (this.#open) {
              this.#close()
            } else {
              this.#open = true
              document.addEventListener('click', this.#closeBeside, true)
              document.addEventListener('keydown', this.#closeOnEscape)
            }
          },
        },
        attrs.buttonContent,
      ),
      m(
        'ul.dropdown-menu.overflow-auto',
        {
          class: `${attrs.menuClass ?? ''} ${attrs.end ? 'dropdown-menu-end' : ''} ${show}`,
          role: 'menu',
          style: {
            position: 'absolute',
            ...(attrs.end ? { right: 0, left: 'auto' } : { left: 0 }),
          },
          onclick: this.#close,
        },
        children,
      ),
    ])
  }
}
