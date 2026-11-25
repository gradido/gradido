// AI-GENERATED — not an architecture reference
import m from 'mithril'
import { t } from '@/i18n'

interface Attrs {
  /** the head with this title and the ×; no head where not set */
  title?: m.Children
  /** the × in the head; on where not set */
  headerClose?: boolean
  /** what a screen reader calls a window without a title */
  label?: string
  /** a message that waits for an answer (`alertdialog`): the body is read as the window opens */
  alert?: boolean
  /** the buttons below the body; no footer where not set */
  footer?: m.Children
  /** asked for by the ×, Escape or a click beside the window */
  onclose: () => void
  /** a click beside the window does not close it */
  noCloseBeside?: boolean
  noCloseOnEscape?: boolean
  /** in the middle of the screen, not at its top */
  centered?: boolean
  /** the body scrolls where the screen is short; head and footer stay */
  scrollable?: boolean
  size?: 'lg'
  /** fills the screen: always, or below Bootstrap's `sm` or `md` */
  fullscreen?: true | 'sm' | 'md'
  dialogClass?: string
  contentClass?: string
  bodyClass?: string
  id?: string
  'data-test'?: string
}

// what the keyboard reaches with Tab
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let lastId = 0

/**
 * A Bootstrap modal that is open as long as it is drawn: the caller draws it while it has
 * something to show, and stops on `onclose`.
 *
 * It is drawn at the end of <body>, not where the caller stands: there a parent that clips or
 * transforms would hold the window inside itself.
 *
 * As it opens the focus goes to what the caller marked `autofocus` inside, else to the window
 * itself, so that it is read from its start.
 */
export class Modal implements m.ClassComponent<Attrs> {
  // what the caller drew last, for the window at the end of <body>
  #drawn!: m.Vnode<Attrs>
  readonly #id = `modal-${++lastId}`
  #pressedBeside = false
  readonly #container = document.createElement('div')
  // where the keyboard was as the window opened: it goes back there as the window closes
  readonly #opener = document.activeElement

  // Escape closes; Tab and Shift+Tab go round inside the window.
  readonly #onkeydown = (event: KeyboardEvent) => {
    if (!this.#isUpper()) {
      return
    }
    if (event.key === 'Escape' && !this.#drawn.attrs.noCloseOnEscape) {
      this.#drawn.attrs.onclose()
      // the listener sits on the document, outside of Mithril's handlers
      m.redraw()
    } else if (event.key === 'Tab') {
      // The browser goes from stop to stop; here only what would leave the window is turned
      // round. The focus may be at what is no stop itself (the window, an entry the arrows
      // reach): behind the last stop, or before the first, counts as at it.
      const tabbable = this.#tabbable()
      const end = event.shiftKey ? tabbable.at(0) : tabbable.at(-1)
      const active = document.activeElement
      const beyond = event.shiftKey
        ? Node.DOCUMENT_POSITION_PRECEDING
        : Node.DOCUMENT_POSITION_FOLLOWING
      if (
        !end ||
        !active ||
        !this.#container.contains(active) ||
        active === end ||
        end.compareDocumentPosition(active) & beyond
      ) {
        event.preventDefault()
        ;(event.shiftKey ? tabbable.at(-1) : tabbable.at(0))?.focus()
      }
    }
  }

  // of two windows, the keys and the focus are for the upper one
  #isUpper() {
    return [...document.querySelectorAll('.modal')].at(-1)?.parentElement === this.#container
  }

  #tabbable() {
    return [
      ...this.#container.querySelectorAll<HTMLElement>(`.modal-dialog :is(${TABBABLE})`),
      // not what only a script gives the focus: a tab not shown, an entry of a pager or a menu
    ].filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0)
  }

  oncreate() {
    document.body.append(this.#container)
    document.body.classList.add('modal-open')
    document.addEventListener('keydown', this.#onkeydown)
    // a root of its own: Mithril redraws it with every other, after the caller's
    m.mount(this.#container, {
      view: () => this.#window(),
      onupdate: () => {
        // what had the keyboard is gone: it stays in the window, at its first stop, or at
        // the window itself where it has none
        if (document.activeElement === document.body && this.#isUpper()) {
          const stop =
            this.#tabbable().at(0) ?? this.#container.querySelector<HTMLElement>('.modal')
          stop?.focus()
        }
      },
    })
    const first =
      this.#container.querySelector<HTMLElement>('[autofocus]') ??
      this.#container.querySelector<HTMLElement>('.modal')
    first?.focus()
  }

  onremove() {
    m.mount(this.#container, null)
    this.#container.remove()
    document.removeEventListener('keydown', this.#onkeydown)
    // not while another window is open
    document.body.classList.toggle('modal-open', document.querySelector('.modal') !== null)
    if (this.#opener instanceof HTMLElement && this.#opener.isConnected) {
      this.#opener.focus()
    }
  }

  // nothing where the caller stands
  view(vnode: m.Vnode<Attrs>) {
    this.#drawn = vnode
    return null
  }

  // The markup bootstrap-vue-next drew, its backdrop beside the window.
  #window() {
    const { attrs, children } = this.#drawn
    const { title, headerClose = true, footer, onclose, fullscreen } = attrs
    return [
      m(
        '.modal.fade.show',
        {
          id: attrs.id,
          'data-test': attrs['data-test'],
          role: attrs.alert ? 'alertdialog' : 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': title === undefined ? undefined : `${this.#id}-title`,
          'aria-label': title === undefined ? attrs.label : undefined,
          'aria-describedby': attrs.alert ? `${this.#id}-body` : undefined,
          tabindex: -1,
          style: { display: 'block', zIndex: 1054 },
          // A body, not an expression: a handler that answers false makes Mithril prevent the
          // click, and no box inside could be ticked.
          onclick: (event: MouseEvent & { target: Element }) => {
            if (
              !attrs.noCloseBeside &&
              this.#pressedBeside &&
              !event.target.closest('.modal-dialog')
            ) {
              onclose()
            }
          },
          // A text marked from inside the window to beside it ends in a click beside it, which
          // must not close: the press has to start there too.
          onpointerdown: (event: PointerEvent & { target: Element; redraw?: boolean }) => {
            event.redraw = false
            this.#pressedBeside = !event.target.closest('.modal-dialog')
          },
        },
        m(
          '.modal-dialog',
          {
            class: [
              attrs.dialogClass,
              fullscreen && `modal-fullscreen${fullscreen === true ? '' : `-${fullscreen}-down`}`,
              attrs.size && `modal-${attrs.size}`,
              attrs.centered && 'modal-dialog-centered',
              attrs.scrollable && 'modal-dialog-scrollable',
            ]
              .filter(Boolean)
              .join(' '),
          },
          m('.modal-content', { class: attrs.contentClass }, [
            title === undefined
              ? null
              : m('.modal-header', [
                  m('h5.modal-title', { id: `${this.#id}-title` }, title),
                  headerClose
                    ? m('button.btn-close', {
                        type: 'button',
                        'aria-label': t('form.close'),
                        onclick: onclose,
                      })
                    : null,
                ]),
            m('.modal-body', { id: `${this.#id}-body`, class: attrs.bodyClass }, children),
            footer === undefined ? null : m('.modal-footer', footer),
          ]),
        ),
      ),
      m('.modal-backdrop.fade.show', { style: { zIndex: 1053 } }),
    ]
  }
}
