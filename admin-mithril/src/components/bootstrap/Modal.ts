// AI-GENERATED — not an architecture reference
import m, { type Children, type ClassComponent, type Vnode } from 'mithril'

interface Attrs {
  title?: Children
  /** the head with the title and the ×; on where not set */
  header?: boolean
  /** what a screen reader calls the window where it has no title */
  label?: string
  contentClass?: string
  bodyClass?: string
  /** the buttons below the body; no footer where not set */
  footer?: Children
  onclose: () => void
  /** in the middle of the window, not at its top */
  centered?: boolean
  /** the body scrolls where the window is short, header and footer stay in it */
  scrollable?: boolean
  size?: 'lg'
  /** the × in the header; on where not set */
  headerClose?: boolean
}

// what the keyboard can reach with Tab
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A Bootstrap modal that is open as long as it is drawn: the caller draws it while it has
 * something to show, and stops on `onclose` -- from the ×, Escape or a click beside it.
 *
 * Drawn into a container of its own at the end of <body>, as bootstrap-vue-next teleported it:
 * where the caller stands -- a row of a table -- the dialog would count as part of it, and the
 * row would take the shade of `table-hover` under the pointer on the dialog.
 */
export class Modal implements ClassComponent<Attrs> {
  // the onclose of the last draw, for the listener on the document
  private onclose?: () => void
  private readonly container = document.createElement('div')
  // where the keyboard was as the window opened: it goes back there as the window closes
  private readonly opener = document.activeElement as HTMLElement | null

  // As bootstrap-vue-next's focus trap: Escape closes, Tab and Shift+Tab go round inside.
  private readonly onkeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.onclose?.()
      // the listener sits on the document, outside of Mithril's event handlers
      m.redraw()
    } else if (event.key === 'Tab') {
      const tabbable = this.tabbable()
      const active = document.activeElement as HTMLElement
      const outside = !tabbable.includes(active)
      const [first, last] = [tabbable[0], tabbable[tabbable.length - 1]]
      if (event.shiftKey ? outside || active === first : outside || active === last) {
        event.preventDefault()
        ;(event.shiftKey ? last : first)?.focus()
      }
    }
  }

  private tabbable() {
    return [
      ...this.container.querySelectorAll<HTMLElement>(`.modal-dialog :is(${TABBABLE})`),
    ].filter((element) => element.getClientRects().length > 0)
  }

  oncreate(vnode: Vnode<Attrs>) {
    document.body.append(this.container)
    document.body.classList.add('modal-open')
    document.addEventListener('keydown', this.onkeydown)
    this.draw(vnode)
    this.container.querySelector<HTMLElement>('.modal')?.focus()
  }

  onupdate(vnode: Vnode<Attrs>) {
    this.draw(vnode)
    // the element that had the keyboard is gone: it stays in the window, at its first place
    if (document.activeElement === document.body) {
      this.tabbable()[0]?.focus()
    }
  }

  onremove() {
    m.render(this.container, null)
    this.container.remove()
    document.body.classList.remove('modal-open')
    document.removeEventListener('keydown', this.onkeydown)
    if (this.opener?.isConnected) {
      this.opener.focus()
    }
  }

  // The redraw after each of its handlers, as Mithril does for what it mounted itself: the third
  // parameter of m.render (mithril/render/render.js), which @types/mithril does not know.
  private draw(vnode: Vnode<Attrs>) {
    ;(m.render as (el: Element, vnodes: Children, redraw: () => void) => void)(
      this.container,
      this.dialog(vnode),
      m.redraw,
    )
  }

  // nothing where the caller draws it
  view() {
    return null
  }

  private dialog({
    attrs: {
      title,
      footer,
      onclose,
      centered,
      scrollable,
      size,
      headerClose = true,
      header = true,
      label,
      contentClass,
      bodyClass,
    },
    children,
  }: Vnode<Attrs>) {
    this.onclose = onclose
    return m(
      '.modal.fade.show',
      {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': label,
        tabindex: -1,
        style: { display: 'block' },
        // A click beside the dialog, on the backdrop. A body, not an expression: a handler that
        // answers false makes Mithril prevent the click -- and no box inside could be ticked.
        onclick: (event: MouseEvent) => {
          if (!(event.target as HTMLElement).closest('.modal-dialog')) {
            onclose()
          }
        },
      },
      [
        m(
          '.modal-dialog',
          {
            class: [
              centered ? 'modal-dialog-centered' : '',
              scrollable ? 'modal-dialog-scrollable' : '',
              size ? `modal-${size}` : '',
            ].join(' '),
          },
          m('.modal-content', { class: contentClass }, [
            header
              ? m('.modal-header', [
                  m('h5.modal-title', title),
                  headerClose
                    ? m('button.btn-close', {
                        type: 'button',
                        'aria-label': 'Close',
                        onclick: onclose,
                      })
                    : null,
                ])
              : null,
            m('.modal-body', { class: bodyClass }, children),
            footer === undefined ? null : m('.modal-footer', footer),
          ]),
        ),
        m('.modal-backdrop.fade.show', { style: { zIndex: -1 } }),
      ],
    )
  }
}
