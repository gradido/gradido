// AI-GENERATED — not an architecture reference

import { qrcanvas } from 'qrcanvas'

// This file exists twice, once in the wallet and once in the admin, because the two
// applications share no code. The copies are byte-identical and a test keeps them that
// way: frontend/src/utils/qrCode.spec.js fails as soon as they drift apart.

// The coin that sits in the middle of the code. The path is absolute on purpose: the
// wallet serves it from its public folder at the root of the site, and the admin picks
// it up from there, because it has no public folder of its own and nginx puts the wallet
// at the root.
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
 * In both applications the cheque can be downloaded from a row in a list, where the
 * modal that shows a code is closed. This is the same generator that modal uses, only
 * without a component around it.
 *
 * @param {string} link
 * @returns {Promise<HTMLCanvasElement>}
 */
export const renderQrCodeCanvas = async (link) =>
  qrcanvas(qrCodeOptions(link, await loadImage(COIN_IMAGE_PATH)))
