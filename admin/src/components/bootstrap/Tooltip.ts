// AI-GENERATED — not an architecture reference
import BootstrapTooltip from 'bootstrap/js/dist/tooltip'
import m, { type ClassComponent, type Vnode, type VnodeDOM } from 'mithril'

interface Attrs {
  title: string
}

/** `children` in a span that shows `title` above it while the pointer or the focus is on it. */
export class Tooltip implements ClassComponent<Attrs> {
  private tooltip?: BootstrapTooltip

  oncreate({ dom, attrs }: VnodeDOM<Attrs>) {
    this.tooltip = new BootstrapTooltip(dom, { title: attrs.title })
  }

  onupdate({ attrs }: VnodeDOM<Attrs>) {
    this.tooltip?.setContent({ '.tooltip-inner': attrs.title })
  }

  onremove() {
    this.tooltip?.dispose()
  }

  view({ children }: Vnode<Attrs>) {
    return m('span', children)
  }
}
