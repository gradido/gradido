// AI-GENERATED — not an architecture reference
import m, { type Children, type ClassComponent, type Vnode, type VnodeDOM } from 'mithril'

interface Attrs {
  /** what the button shows */
  toggle: Children
  /** classes of the button beside btn and dropdown-toggle; a link of the nav where not set */
  toggleClass?: string
  /** the size of the button; md where not set */
  size?: 'sm' | 'md'
  /** classes of the dropdown itself */
  class?: string
  'data-test'?: string
  /** the button's name, where what it shows is no text */
  label?: string
  /** hangs the menu from the right end of the button, not the left */
  end?: boolean
  /** how far below the button the menu opens, in px */
  offset?: number
}

/**
 * A Bootstrap dropdown, the menu `children`. It closes on a choice in it, on Escape and on a click
 * beside it; the focus goes back to the button, as the entry it stood on is hidden.
 */
export class Dropdown implements ClassComponent<Attrs> {
  private open = false
  private dom?: Element

  private readonly close = () => {
    this.open = false
    this.dom?.querySelector<HTMLElement>('.dropdown-toggle')?.focus()
    document.removeEventListener('click', this.closeBeside, true)
    document.removeEventListener('keydown', this.closeOnEscape)
  }

  // listeners on the document, outside of Mithril's handlers: they redraw themselves
  private readonly closeBeside = (event: MouseEvent) => {
    if (!this.dom?.contains(event.target as Node)) {
      this.close()
      m.redraw()
    }
  }

  private readonly closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.close()
      m.redraw()
    }
  }

  private toggle() {
    if (this.open) {
      this.close()
      return
    }
    this.open = true
    document.addEventListener('click', this.closeBeside, true)
    document.addEventListener('keydown', this.closeOnEscape)
  }

  oncreate({ dom }: VnodeDOM<Attrs>) {
    this.dom = dom
  }

  onremove() {
    document.removeEventListener('click', this.closeBeside, true)
    document.removeEventListener('keydown', this.closeOnEscape)
  }

  view({ attrs, children }: Vnode<Attrs>) {
    const { toggle, toggleClass = 'btn-link nav-link', size = 'md', label, end, offset = 0 } = attrs
    const show = this.open ? 'show' : ''
    return m('.dropdown', { class: attrs.class, 'data-test': attrs['data-test'] }, [
      m(
        'button.btn.dropdown-toggle',
        {
          type: 'button',
          class: [`btn-${size}`, toggleClass, show].join(' '),
          'aria-label': label,
          'aria-expanded': String(this.open),
          'aria-haspopup': 'menu',
          onclick: () => this.toggle(),
        },
        toggle,
      ),
      m(
        'ul.dropdown-menu.overflow-auto',
        {
          class: [end ? 'dropdown-menu-end' : '', show].join(' '),
          role: 'menu',
          style: {
            position: 'absolute',
            top: '100%',
            marginTop: `${offset}px`,
            ...(end ? { right: 0, left: 'auto' } : { left: 0 }),
          },
          onclick: this.close,
        },
        children,
      ),
    ])
  }
}
