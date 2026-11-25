import m from 'mithril'

interface Attrs {
  tabs: { title: m.Children; content: m.Children }[]
  active: number
  onchange: (index: number) => void
  /** what a screen reader calls the row of tabs */
  label: string
  class?: string
  /** classes of the row of tabs: its look and alignment (`nav-tabs`, `justify-content-center`) */
  navClass?: string
}

let lastId = 0

/**
 * Bootstrap's tabs: the row of tabs and a pane for each. Only the active pane has its
 * content: what a tab asks the server is asked when it is shown, and anew when it is shown
 * again. ←, →, Home and End move the focus from tab to tab; only the active tab is in the
 * tab order.
 */
export class Tabs implements m.ClassComponent<Attrs> {
  readonly #id = `tabs-${++lastId}`

  view({ attrs: { tabs, active, onchange, label, class: classes, navClass } }: m.Vnode<Attrs>) {
    // Only the focus moves: a tab is shown by Enter, Space or a click, since showing it may
    // ask the server. From the last tab → goes to the first, from the first ← to the last.
    const onkeydown = (event: KeyboardEvent & { currentTarget: Element; redraw?: boolean }) => {
      event.redraw = false
      const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')]
      const at = buttons.findIndex((button) => button === document.activeElement)
      const to = {
        ArrowLeft: (at - 1 + buttons.length) % buttons.length,
        ArrowRight: (at + 1) % buttons.length,
        Home: 0,
        End: buttons.length - 1,
      }[event.key]
      if (at >= 0 && to !== undefined) {
        event.preventDefault()
        buttons[to].focus()
      }
    }
    return m('.tabs', { class: classes }, [
      m(
        'div',
        m(
          'ul.nav',
          { class: navClass, role: 'tablist', 'aria-label': label, onkeydown },
          tabs.map(({ title }, index) =>
            m(
              'li.nav-item',
              { role: 'presentation' },
              m(
                'button.nav-link',
                {
                  // inside a form a button without a type would submit it
                  type: 'button',
                  id: `${this.#id}-tab-${index}`,
                  class: index === active ? 'active' : '',
                  role: 'tab',
                  'aria-controls': `${this.#id}-pane-${index}`,
                  'aria-selected': String(index === active),
                  tabindex: index === active ? undefined : -1,
                  onclick: () => index !== active && onchange(index),
                },
                title,
              ),
            ),
          ),
        ),
      ),
      m(
        '.tab-content',
        tabs.map(({ content }, index) =>
          m(
            '.tab-pane.fade',
            {
              id: `${this.#id}-pane-${index}`,
              class: index === active ? 'active show' : '',
              role: 'tabpanel',
              // what it shows may hold nothing the keyboard reaches: the pane itself is a stop
              tabindex: index === active ? 0 : undefined,
              'aria-labelledby': `${this.#id}-tab-${index}`,
            },
            index === active ? content : null,
          ),
        ),
      ),
    ])
  }
}
