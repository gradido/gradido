// AI-GENERATED — not an architecture reference
import m, { type Children, type ClassComponent, type Vnode } from 'mithril'

export type Tab = { title: Children; disabled?: boolean; content?: Children }

interface Attrs {
  tabs: Tab[]
  active: number
  onchange: (index: number) => void
  /** the tabs share the width */
  fill?: boolean
  class?: string
  contentClass?: string
  /** a pane is drawn once its tab was shown, and then kept: what it asks for is asked then */
  lazy?: boolean
}

let lastId = 0

/**
 * Bootstrap's tabs, as BTabs drew them: the nav of the tabs and a pane for each, the active one
 * shown. The arrow keys, Home and End go from tab to tab.
 */
export class Tabs implements ClassComponent<Attrs> {
  private readonly id = `tabs-${++lastId}`
  private readonly shown = new Set<number>()

  view({
    attrs: { tabs, active, onchange, fill, class: className, contentClass, lazy },
  }: Vnode<Attrs>) {
    this.shown.add(active)
    const enabled = tabs.flatMap((tab, index) => (tab.disabled ? [] : [index]))
    const go = (event: KeyboardEvent) => {
      const at = enabled.indexOf(active)
      const to = {
        ArrowLeft: enabled[at - 1],
        ArrowUp: enabled[at - 1],
        ArrowRight: enabled[at + 1],
        ArrowDown: enabled[at + 1],
        Home: enabled[0],
        End: enabled.at(-1),
      }[event.key]
      if (to !== undefined) {
        event.preventDefault()
        onchange(to)
        // the tab chosen takes the focus once it is drawn as the active one
        requestAnimationFrame(() => document.getElementById(`${this.id}-tab-${to}`)?.focus())
      }
    }
    return m('.tabs', { class: className }, [
      m(
        'div',
        m(
          'ul.nav.nav-tabs',
          {
            class: fill ? 'nav-fill' : '',
            role: 'tablist',
            'aria-orientation': 'horizontal',
            onkeydown: go,
          },
          tabs.map((tab, index) =>
            m(
              'li.nav-item',
              { role: 'presentation' },
              m(
                'button.nav-link',
                {
                  // inside a form a button without a type would submit it
                  type: 'button',
                  id: `${this.id}-tab-${index}`,
                  class: [index === active ? 'active' : '', tab.disabled ? 'disabled' : ''].join(
                    ' ',
                  ),
                  role: 'tab',
                  'aria-controls': `${this.id}-pane-${index}`,
                  'aria-selected': String(index === active),
                  tabindex: index === active ? undefined : '-1',
                  disabled: tab.disabled,
                  onclick: () => index !== active && onchange(index),
                },
                tab.title,
              ),
            ),
          ),
        ),
      ),
      m(
        '.tab-content',
        { class: contentClass },
        tabs.map((tab, index) =>
          m(
            '.tab-pane.fade',
            {
              id: `${this.id}-pane-${index}`,
              class: index === active ? 'active show' : '',
              role: 'tabpanel',
              'aria-labelledby': `${this.id}-tab-${index}`,
            },
            !lazy || this.shown.has(index) ? tab.content : null,
          ),
        ),
      ),
    ])
  }
}
