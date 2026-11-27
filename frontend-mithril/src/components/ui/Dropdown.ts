import m from 'mithril'
import './Dropdown.css'

interface Attrs {
  /** what the button shows */
  buttonContent: m.Children
  /** the button's classes; Bootstrap's grey button with its caret where not set */
  buttonClass?: string
  /** the menu's classes; Bootstrap's `dropdown-menu` where not set */
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

let lastId = 0
// an entry of the menu: `menuitem`, `menuitemradio` or `menuitemcheckbox`
const ENTRY = '[role^="menuitem"]'

/**
 * A menu button (WAI-ARIA); `children` are the entries of its menu:
 * `li[role=none] > button.dropdown-item[role=menuitem][tabindex=-1]`. An entry that cannot be
 * chosen says `aria-disabled`, not `disabled`: the keyboard still reaches it.
 *
 * As the menu opens the focus goes to its first entry (to its last with ↑ on the button); ↓ and
 * ↑ go round the entries, Home and End to the ends. It closes on a choice and on Escape, and
 * the focus goes back to the button; Tab closes it and goes on, and a click beside it closes
 * it and leaves the focus where the click put it. The menu
 * opens below the button, or above it where the window has more room there and the menu does
 * not fit below; it is never higher than the room it opens into.
 */
export class Dropdown implements m.ClassComponent<Attrs> {
  readonly #id = `dropdown-${++lastId}`
  #open = false
  #dom?: Element
  // the end of the menu that takes the focus once the menu is drawn open
  #focusOnOpen?: 'first' | 'last'

  #openMenu(focus: 'first' | 'last') {
    this.#open = true
    this.#focusOnOpen = focus
    document.addEventListener('click', this.#closeBeside, true)
  }

  readonly #close = (focusButton = true) => {
    this.#open = false
    if (focusButton) {
      document.getElementById(`${this.#id}-button`)?.focus()
    }
    document.removeEventListener('click', this.#closeBeside, true)
  }

  // a listener on the document, outside of Mithril's handlers: it redraws itself
  readonly #closeBeside = (event: MouseEvent) => {
    if (event.target instanceof Node && !this.#dom?.contains(event.target)) {
      // The focus stays where the click put it (a field beside the menu). Where it put it
      // nowhere, the focus is still at an entry, which is about to be hidden: to the button.
      this.#close(this.#dom?.contains(document.activeElement))
      m.redraw()
    }
  }

  oncreate({ dom }: m.VnodeDOM<Attrs>) {
    this.#dom = dom
  }

  // After the draw and before the paint: an open menu can be measured, and is never seen in
  // the wrong place. The view leaves `top`, `bottom` and `maxHeight` alone, so they stay.
  onupdate({ dom, attrs }: m.VnodeDOM<Attrs>) {
    const menu = dom.querySelector<HTMLElement>('[role="menu"]')
    if (!this.#open || !menu) {
      return
    }
    menu.style.maxHeight = ''
    const button = dom.getBoundingClientRect()
    const below = window.innerHeight - button.bottom
    const up = !attrs.noFlip && menu.offsetHeight > below && button.top > below
    menu.style.top = up ? 'auto' : '100%'
    menu.style.bottom = up ? '100%' : 'auto'
    // a height of the menu's own stylesheet stays where the room is larger
    const room = up ? button.top : below
    const own = Number.parseFloat(getComputedStyle(menu).maxHeight)
    menu.style.maxHeight = `${Number.isNaN(own) ? room : Math.min(own, room)}px`
    if (this.#focusOnOpen) {
      const entries = [...menu.querySelectorAll<HTMLElement>(ENTRY)]
      entries.at(this.#focusOnOpen === 'first' ? 0 : -1)?.focus()
      this.#focusOnOpen = undefined
    }
  }

  onremove() {
    document.removeEventListener('click', this.#closeBeside, true)
  }

  readonly #onkeydown = (
    event: KeyboardEvent & { currentTarget: HTMLElement; redraw?: boolean },
  ) => {
    const { key } = event
    if (!this.#open) {
      // on the button: Enter and Space are its click
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault()
        this.#openMenu(key === 'ArrowDown' ? 'first' : 'last')
      } else {
        event.redraw = false
      }
    } else if (key === 'Escape') {
      // the menu only: not a modal the dropdown stands in
      event.stopPropagation()
      this.#close()
    } else if (key === 'Tab') {
      // the focus is at the button now, and the key goes on from there
      this.#close()
    } else {
      // nothing changes but the focus
      event.redraw = false
      const entries = [...event.currentTarget.querySelectorAll<HTMLElement>(ENTRY)]
      const at = Math.max(
        entries.findIndex((entry) => entry === document.activeElement),
        0,
      )
      const to = {
        ArrowDown: (at + 1) % entries.length,
        ArrowUp: (at - 1 + entries.length) % entries.length,
        Home: 0,
        End: entries.length - 1,
      }[key]
      if (to !== undefined) {
        event.preventDefault()
        entries[to]?.focus()
      }
    }
  }

  view({ attrs, children }: m.Vnode<Attrs>) {
    const show = this.#open ? 'show' : ''
    return m(
      '.dropdown',
      { class: attrs.class, 'data-test': attrs['data-test'], onkeydown: this.#onkeydown },
      [
        m(
          'button',
          {
            type: 'button',
            class: `${attrs.buttonClass ?? 'btn btn-md btn-secondary dropdown-toggle'} ${show}`,
            id: `${this.#id}-button`,
            disabled: attrs.disabled,
            'aria-label': attrs.label,
            'aria-expanded': String(this.#open),
            'aria-haspopup': 'menu',
            'aria-controls': this.#open ? `${this.#id}-menu` : undefined,
            onclick: () => (this.#open ? this.#close() : this.#openMenu('first')),
          },
          attrs.buttonContent,
        ),
        // drawn only while open: a menu of other classes than Bootstrap's is not hidden by them
        this.#open &&
          m(
            'ul.overflow-auto',
            {
              class: `${attrs.menuClass ?? 'dropdown-menu'} ${attrs.end ? 'dropdown-menu-end' : ''} ${show}`,
              id: `${this.#id}-menu`,
              role: 'menu',
              'aria-labelledby': `${this.#id}-button`,
              style: {
                position: 'absolute',
                ...(attrs.end ? { right: 0, left: 'auto' } : { left: 0 }),
              },
              // a choice closes the menu; an entry that cannot be chosen does not
              onclick: (event: MouseEvent & { target: Element }) => {
                if (event.target.closest(`${ENTRY}:not([aria-disabled="true"])`)) {
                  this.#close()
                }
              },
            },
            children,
          ),
      ],
    )
  }
}
