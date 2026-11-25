import m from 'mithril'

interface Attrs {
  tabs: { title: m.Children; content: m.Children }[]
  active: number
  onchange: (index: number) => void
  class?: string
  /** classes of the row of tabs: its look and alignment (`nav-tabs`, `justify-content-center`) */
  navClass?: string
}

let lastId = 0

/**
 * Bootstrap's tabs: the row of tabs and a pane for each. Only the active pane has its
 * content: what a tab asks the server is asked when it is shown, and anew when it is shown
 * again. The arrow keys, Home and End go from tab to tab.
 */
export class Tabs implements m.ClassComponent<Attrs> {
  readonly #id = `tabs-${++lastId}`

  view({ attrs: { tabs, active, onchange, class: classes, navClass } }: m.Vnode<Attrs>) {
    const onkeydown = (event: KeyboardEvent) => {
      const to = {
        ArrowLeft: active - 1,
        ArrowUp: active - 1,
        ArrowRight: active + 1,
        ArrowDown: active + 1,
        Home: 0,
        End: tabs.length - 1,
      }[event.key]
      if (to !== undefined && to >= 0 && to < tabs.length) {
        event.preventDefault()
        onchange(to)
        // the tab chosen takes the focus once it is drawn as the active one
        requestAnimationFrame(() => document.getElementById(`${this.#id}-tab-${to}`)?.focus())
      }
    }
    return m('.tabs', { class: classes }, [
      m(
        'div',
        m(
          'ul.nav',
          { class: navClass, role: 'tablist', 'aria-orientation': 'horizontal', onkeydown },
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
              'aria-labelledby': `${this.#id}-tab-${index}`,
            },
            index === active ? content : null,
          ),
        ),
      ),
    ])
  }
}
