// AI-GENERATED — not an architecture reference

import m, { type ClassComponent, type Vnode, type VnodeDOM } from 'mithril'
import classes from '@/components/FigureQrCode.module.css'
import { renderQrCodeCanvas } from '@/utils/qrCode'

interface Attrs {
  link: string
}

/**
 * The QR code of `link`, with the coin in its middle: drawn once the coin has loaded, nothing
 * before -- and nothing where it does not load, as before.
 */
export class FigureQrCode implements ClassComponent<Attrs> {
  oncreate({ attrs, dom }: VnodeDOM<Attrs>) {
    renderQrCodeCanvas(attrs.link)
      .then((canvas) => {
        canvas.className = classes.canvas
        dom.querySelector(`.${classes.qrbox}`)?.append(canvas)
      })
      .catch(() => {
        // the coin did not load: no code, as before
      })
  }

  view(_vnode: Vnode<Attrs>) {
    return m('.figure-qr-code', m('div', { class: classes.qrbox }))
  }
}
