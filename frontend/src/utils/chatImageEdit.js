// AI-GENERATED — not an architecture reference
import { nextRotation } from '@/utils/avatarGeometry'

// A chat picture turned, mirrored and cut before it goes (E-047), the way the avatar's cropper does
// it for its square: the frame stands, the picture is moved under it and made larger with "Größe".
// The frame here is a rectangle in one of four shapes, and at size 1 it holds as much of the
// picture as the shape allows -- "Original" the whole picture.
//
// An edit is a few numbers, never pixels:
//   { turn: 0 | 90 | 180 | 270, mirrored, shape, zoom: 1 … 4, panX: -1 … 1, panY: -1 … 1 }
// `pan` is where the cutout stands in the room it has to move, -1 at one edge, 1 at the other --
// so the same edit means the same cutout on a phone and at a desk, in the editor, in the preview,
// in the file that is saved and in the one that is sent.

/** The shapes of the cutout, width to height; "original" is the picture's own, as turned. */
export const CHAT_IMAGE_SHAPES = Object.freeze({
  original: null,
  landscape: 4 / 3,
  portrait: 3 / 4,
  square: 1,
})

/** How far the picture may be made larger under the frame: the avatar's slider goes to 4 as well. */
export const CHAT_IMAGE_ZOOM_MAX = 4

/**
 * The largest picture "Sichern" writes, in pixels: what an iPhone's browser allows a drawing
 * surface (4096 x 4096). Beyond it Safari hands back an empty picture without a word. A camera's
 * 12 megapixels fit whole; 24 and 48 are drawn down to it (E-047, point 5).
 */
export const CHAT_IMAGE_FULL_MAX_PIXELS = 4096 * 4096

/** The picture as it was chosen: not turned, not mirrored, the whole of it. */
export const CHAT_IMAGE_UNEDITED = Object.freeze({
  turn: 0,
  mirrored: false,
  shape: 'original',
  zoom: 1,
  panX: 0,
  panY: 0,
})

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

/** The picture's size as it is seen after the turn: a quarter turn swaps width and height. */
export const turnedSize = (width, height, turn) =>
  turn % 180 ? { width: height, height: width } : { width, height }

/**
 * The cutout, in pixels of the picture as it is seen after the turn and the mirror: its size and
 * where its middle stands. The largest rectangle of the shape that fits the picture, divided by
 * the size, moved by the pan.
 *
 * @param {number} width the picture's own width, as the browser decoded it
 * @param {number} height its own height
 * @param {typeof CHAT_IMAGE_UNEDITED} edit
 */
export const chatImageCut = (width, height, edit) => {
  const turned = turnedSize(width, height, edit.turn)
  const aspect = CHAT_IMAGE_SHAPES[edit.shape] ?? turned.width / turned.height
  let largestWidth = turned.width
  let largestHeight = turned.width / aspect
  if (largestHeight > turned.height) {
    largestHeight = turned.height
    largestWidth = turned.height * aspect
  }
  const cutWidth = largestWidth / edit.zoom
  const cutHeight = largestHeight / edit.zoom
  return {
    turnedWidth: turned.width,
    turnedHeight: turned.height,
    aspect,
    width: cutWidth,
    height: cutHeight,
    centerX: turned.width / 2 + (edit.panX * (turned.width - cutWidth)) / 2,
    centerY: turned.height / 2 + (edit.panY * (turned.height - cutHeight)) / 2,
  }
}

/**
 * The cutout's size in whole pixels -- for the readout, and for "Sichern" with the iPhone's bound
 * (the cutout drawn smaller, in its own proportions, where it is larger).
 *
 * ⛔ Rounded DOWN where it is made smaller: rounded to the nearest, 8000 x 6000 came to 94 pixels
 * over the bound -- and past it Safari draws nothing at all.
 */
export const chatImageCutSize = (width, height, edit, maxPixels = Infinity) => {
  const cut = chatImageCut(width, height, edit)
  const scale = Math.min(1, Math.sqrt(maxPixels / (cut.width * cut.height)))
  const whole = scale < 1 ? Math.floor : Math.round
  return {
    width: Math.max(1, whole(cut.width * scale)),
    height: Math.max(1, whole(cut.height * scale)),
  }
}

/**
 * A quarter turn clockwise, as the avatar's "Drehen": four presses and it is back. Size and place
 * start over in the middle -- after a quarter turn the old place is one that no longer exists.
 */
export const turnChatImage = (edit) => ({
  ...edit,
  turn: nextRotation(edit.turn),
  zoom: 1,
  panX: 0,
  panY: 0,
})

/**
 * Left to right, on the screen, whatever the turn. The cutout keeps showing the same part: it goes
 * over to the other side with the picture, as the avatar's mirror does.
 */
export const mirrorChatImage = (edit) => ({ ...edit, mirrored: !edit.mirrored, panX: -edit.panX })

/** Another shape: the largest cutout of it, in the middle. */
export const shapeChatImage = (edit, shape) => ({ ...edit, shape, zoom: 1, panX: 0, panY: 0 })

/** Larger or smaller under the frame, from 1 (the whole shape) to CHAT_IMAGE_ZOOM_MAX. */
export const zoomChatImage = (edit, zoom) => ({
  ...edit,
  zoom: clamp(Number(zoom) || 1, 1, CHAT_IMAGE_ZOOM_MAX),
})

/**
 * The cutout moved by (dx, dy) pixels of the turned picture, as far as the picture reaches. A
 * finger moves the PICTURE: dragging it to the right moves the cutout to the left, so the caller
 * passes the finger's way, turned round and divided by the scale on the screen.
 */
export const panChatImage = (edit, width, height, dx, dy) => {
  const cut = chatImageCut(width, height, edit)
  const roomX = (cut.turnedWidth - cut.width) / 2
  const roomY = (cut.turnedHeight - cut.height) / 2
  return {
    ...edit,
    panX: roomX > 0 ? clamp(edit.panX + dx / roomX, -1, 1) : 0,
    panY: roomY > 0 ? clamp(edit.panY + dy / roomY, -1, 1) : 0,
  }
}

/**
 * Draws the picture with its edit so that the cutout fills `target` exactly; what lies around the
 * cutout is drawn around the target, as far as the canvas goes. One function for the editor, the
 * preview, the file that is saved and the picture that is sent -- so none of them can show another
 * part than the member chose (the avatar's rule for its preview and its two renditions).
 *
 * Turned first, then mirrored on the screen: "Spiegeln" is left to right whatever the turn.
 *
 * ⛔ Drawn straight into the target's size. Painting the photo at full size first and scaling it
 * down afterwards is what returns an empty picture on an iPhone (the avatar's cropper, `drawSquare`).
 *
 * @param {CanvasRenderingContext2D} context
 * @param {CanvasImageSource} image the picture, or a smaller copy of it in the same proportions
 * @param {number} width the picture's own width -- the copy is drawn at this size
 * @param {number} height its own height
 * @param {typeof CHAT_IMAGE_UNEDITED} edit
 * @param {{ x: number, y: number, width: number, height: number }} target where the cutout goes
 */
export const drawChatImageCut = (context, image, width, height, edit, target) => {
  const cut = chatImageCut(width, height, edit)
  context.save()
  context.translate(target.x + target.width / 2, target.y + target.height / 2)
  context.scale(target.width / cut.width, target.height / cut.height)
  context.translate(cut.turnedWidth / 2 - cut.centerX, cut.turnedHeight / 2 - cut.centerY)
  if (edit.mirrored) context.scale(-1, 1)
  context.rotate((edit.turn * Math.PI) / 180)
  context.drawImage(image, -width / 2, -height / 2, width, height)
  context.restore()
}
