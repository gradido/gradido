import m from 'mithril'
import classes from './Collapse.module.css'

interface Attrs {
  open: boolean
  id?: string
  /** classes of the content: its paddings and margins, which slide with it */
  class?: string
}

/**
 * `children` in a box that slides open and shut with `open`. They are drawn from the first
 * time it opens: a box never opened costs nothing.
 */
export class Collapse implements m.ClassComponent<Attrs> {
  #wasOpen = false

  view({ attrs, children }: m.Vnode<Attrs>) {
    this.#wasOpen ||= attrs.open
    return m(
      'div',
      { id: attrs.id, class: `${classes.collapse} ${attrs.open ? classes.open : ''}` },
      m(
        'div',
        { class: classes.clip },
        this.#wasOpen && m('div', { class: attrs.class }, children),
      ),
    )
  }
}
