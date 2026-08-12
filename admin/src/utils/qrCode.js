// AI-GENERATED — not an architecture reference

import { qrcanvas } from 'qrcanvas'

// The coin that sits in the middle of the code. It is served by the wallet, not by
// the admin: the admin has no public folder of its own, so an absolute path is
// resolved against the root of the site, and nginx puts the wallet there.
export const COIN_IMAGE_PATH = '/img/gdd-coin.png'

/**
 * The settings of the QR code, in one place.
 *
 * The code shown in the modal and the code printed on the cheque have to be the
 * same one. An admin who checks a link on screen and then prints it must not end
 * up with two different pictures, so neither call site spells the settings out.
 */
export const qrCodeOptions = (link, coinImage) => ({
  cellSize: 8,
  correctLevel: 'H',
  data: link,
  logo: { image: coinImage },
})

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`cannot load image: ${source}`))
    image.src = source
  })

/**
 * Renders a QR code onto a canvas that never reaches the page.
 *
 * The cheque download sits in the table row of the contribution links, where no
 * code is on screen to copy from. This is the same generator the modal uses, only
 * without a component around it.
 *
 * @param {string} link
 * @returns {Promise<HTMLCanvasElement>}
 */
export const renderQrCodeCanvas = async (link) =>
  qrcanvas(qrCodeOptions(link, await loadImage(COIN_IMAGE_PATH)))
