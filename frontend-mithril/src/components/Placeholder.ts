import m from 'mithril'
import classes from './Placeholder.module.css'

export enum PlaceholderType {
  /** a line of text */
  Line,
  /** a block of `height` */
  Block,
  /** a row of a list: two lines */
  Row,
  /** a row of a list with the member's picture before its two lines */
  PictureRow,
}

type Attrs = { type: PlaceholderType; width?: string; height?: string }

/**
 * What stands where content is on its way (ARCHITECTURE.md, "Waiting"), in the shape and size
 * of what comes (`PlaceholderType`), so that nothing moves when it is here. For content only:
 * what the member started locks its button (`BusyButton`).
 */
export class Placeholder implements m.ClassComponent<Attrs> {
  #shape({ width, height }: { width?: string; height?: string } = {}, more = '') {
    // nothing to read: the region that waits says `aria-busy`
    return m('div', {
      class: `${classes.shape} ${more}`,
      style: { width, height },
      'aria-hidden': 'true',
    })
  }

  view({ attrs }: m.Vnode<Attrs>) {
    if (attrs.type === PlaceholderType.Line || attrs.type === PlaceholderType.Block) {
      return this.#shape(attrs)
    }
    const lines = m('div', { class: classes.lines }, [this.#shape(), this.#shape()])
    return attrs.type === PlaceholderType.PictureRow
      ? m('div', { class: classes.row }, [this.#shape({}, classes.picture), lines])
      : lines
  }
}
