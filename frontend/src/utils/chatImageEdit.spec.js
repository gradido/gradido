// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import {
  CHAT_IMAGE_FULL_MAX_PIXELS,
  CHAT_IMAGE_SHAPES,
  CHAT_IMAGE_UNEDITED,
  CHAT_IMAGE_ZOOM_MAX,
  chatImageCut,
  chatImageCutSize,
  drawChatImageCut,
  mirrorChatImage,
  panChatImage,
  shapeChatImage,
  turnChatImage,
  turnedSize,
  zoomChatImage,
} from './chatImageEdit'

const edit = (changes = {}) => ({ ...CHAT_IMAGE_UNEDITED, ...changes })

/**
 * A 2D context that does the arithmetic a canvas does and remembers where drawImage put the
 * picture: the transforms are multiplied as the canvas multiplies them, so where a point of the
 * picture lands can be asked of it. jsdom has no canvas; this measures the geometry itself.
 */
const measuringContext = () => {
  let matrix = [1, 0, 0, 1, 0, 0]
  const saved = []
  const multiply = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [
    a * A + c * B,
    b * A + d * B,
    a * C + c * D,
    b * C + d * D,
    a * E + c * F + e,
    b * E + d * F + f,
  ]
  const context = {
    drawn: null,
    save: () => saved.push(matrix),
    restore: () => (matrix = saved.pop()),
    translate: (x, y) => (matrix = multiply(matrix, [1, 0, 0, 1, x, y])),
    scale: (x, y) => (matrix = multiply(matrix, [x, 0, 0, y, 0, 0])),
    rotate: (angle) =>
      (matrix = multiply(matrix, [
        Math.cos(angle),
        Math.sin(angle),
        -Math.sin(angle),
        Math.cos(angle),
        0,
        0,
      ])),
    drawImage: (image, x, y, width, height) => {
      const [a, b, c, d, e, f] = matrix
      // where the point (u, v) of the picture, in its own pixels, lands on the canvas
      context.drawn = (u, v) => {
        const px = x + (u * width) / image.width
        const py = y + (v * height) / image.height
        return [a * px + c * py + e, b * px + d * py + f].map((n) => Math.round(n * 1000) / 1000)
      }
    },
  }
  return context
}

describe('the shapes and the bounds', () => {
  it('offers the picture’s own shape, landscape 4 : 3, portrait 3 : 4 and a square', () => {
    expect(CHAT_IMAGE_SHAPES).toEqual({
      original: null,
      landscape: 4 / 3,
      portrait: 3 / 4,
      square: 1,
    })
  })

  it('goes to four times the size, as the avatar’s slider', () => {
    expect(CHAT_IMAGE_ZOOM_MAX).toBe(4)
  })

  // What an iPhone's browser draws at most (E-047, point 5).
  it('saves at most 4096 x 4096 pixels', () => {
    expect(CHAT_IMAGE_FULL_MAX_PIXELS).toBe(16777216)
  })

  it('starts with the picture as chosen', () => {
    expect(CHAT_IMAGE_UNEDITED).toEqual({
      turn: 0,
      mirrored: false,
      shape: 'original',
      zoom: 1,
      panX: 0,
      panY: 0,
    })
    expect(Object.isFrozen(CHAT_IMAGE_UNEDITED)).toBe(true)
  })
})

describe('turnedSize', () => {
  it('swaps width and height at a quarter turn, not at a half', () => {
    expect(turnedSize(4000, 3000, 0)).toEqual({ width: 4000, height: 3000 })
    expect(turnedSize(4000, 3000, 90)).toEqual({ width: 3000, height: 4000 })
    expect(turnedSize(4000, 3000, 180)).toEqual({ width: 4000, height: 3000 })
    expect(turnedSize(4000, 3000, 270)).toEqual({ width: 3000, height: 4000 })
  })
})

describe('chatImageCut', () => {
  it('takes the whole picture as chosen', () => {
    expect(chatImageCut(4000, 3000, edit())).toMatchObject({
      width: 4000,
      height: 3000,
      centerX: 2000,
      centerY: 1500,
    })
  })

  it('takes the largest rectangle of the shape that fits, in the middle', () => {
    // a landscape photo of 4 : 3 is already the landscape shape
    expect(chatImageCut(4000, 3000, edit({ shape: 'landscape' }))).toMatchObject({
      width: 4000,
      height: 3000,
    })
    expect(chatImageCut(4000, 3000, edit({ shape: 'portrait' }))).toMatchObject({
      width: 2250,
      height: 3000,
      centerX: 2000,
    })
    expect(chatImageCut(4000, 3000, edit({ shape: 'square' }))).toMatchObject({
      width: 3000,
      height: 3000,
    })
    // …and a tall screenshot cut to landscape keeps its whole width
    expect(chatImageCut(1080, 2340, edit({ shape: 'landscape' }))).toMatchObject({
      width: 1080,
      height: 810,
    })
  })

  it('makes the cutout smaller as the picture is made larger', () => {
    expect(chatImageCut(4000, 3000, edit({ zoom: 2 }))).toMatchObject({ width: 2000, height: 1500 })
    expect(chatImageCut(4000, 3000, edit({ shape: 'square', zoom: 4 }))).toMatchObject({
      width: 750,
      height: 750,
    })
  })

  it('moves the cutout across the room it has, edge to edge', () => {
    const left = chatImageCut(4000, 3000, edit({ zoom: 2, panX: -1, panY: -1 }))
    expect([left.centerX - left.width / 2, left.centerY - left.height / 2]).toEqual([0, 0])
    const right = chatImageCut(4000, 3000, edit({ zoom: 2, panX: 1, panY: 1 }))
    expect([right.centerX + right.width / 2, right.centerY + right.height / 2]).toEqual([
      4000, 3000,
    ])
  })

  it('measures the turned picture after a quarter turn', () => {
    expect(chatImageCut(4000, 3000, edit({ turn: 90 }))).toMatchObject({
      turnedWidth: 3000,
      turnedHeight: 4000,
      width: 3000,
      height: 4000,
      aspect: 0.75,
    })
  })
})

describe('chatImageCutSize', () => {
  it('answers in whole pixels', () => {
    expect(chatImageCutSize(4000, 3000, edit({ zoom: 3 }))).toEqual({ width: 1333, height: 1000 })
  })

  // A 48-megapixel photo is saved at the iPhone's bound, in its proportions.
  it('keeps a large cutout within the bound given, in its proportions', () => {
    const size = chatImageCutSize(8000, 6000, edit(), CHAT_IMAGE_FULL_MAX_PIXELS)
    expect(size.width * size.height).toBeLessThanOrEqual(CHAT_IMAGE_FULL_MAX_PIXELS)
    expect(size.width * size.height).toBeGreaterThan(CHAT_IMAGE_FULL_MAX_PIXELS * 0.999)
    expect(size.width / size.height).toBeCloseTo(4 / 3, 3)
    // …and leaves a 12-megapixel photo whole
    expect(chatImageCutSize(4032, 3024, edit(), CHAT_IMAGE_FULL_MAX_PIXELS)).toEqual({
      width: 4032,
      height: 3024,
    })
  })
})

describe('the tools', () => {
  it('turns a quarter clockwise, four times round, and starts size and place over', () => {
    let turned = edit({ shape: 'square', mirrored: true, zoom: 3, panX: 0.5, panY: -0.5 })
    const turns = []
    for (let press = 0; press < 4; press += 1) {
      turned = turnChatImage(turned)
      turns.push(turned.turn)
    }
    expect(turns).toEqual([90, 180, 270, 0])
    expect(turned).toEqual(edit({ shape: 'square', mirrored: true }))
  })

  // The cutout keeps showing the same part: it crosses over with the picture.
  it('mirrors left to right and takes the cutout across with it', () => {
    const mirrored = mirrorChatImage(edit({ zoom: 2, panX: 0.6, panY: 0.3 }))
    expect(mirrored).toEqual(edit({ zoom: 2, mirrored: true, panX: -0.6, panY: 0.3 }))
    expect(mirrorChatImage(mirrored).mirrored).toBe(false)
  })

  it('starts a new shape with its largest cutout, in the middle', () => {
    expect(shapeChatImage(edit({ turn: 90, zoom: 2, panX: 1 }), 'square')).toEqual(
      edit({ turn: 90, shape: 'square' }),
    )
  })

  it('keeps the size between 1 and 4', () => {
    expect(zoomChatImage(edit(), '2.5').zoom).toBe(2.5)
    expect(zoomChatImage(edit(), 9).zoom).toBe(4)
    expect(zoomChatImage(edit(), 0.2).zoom).toBe(1)
    expect(zoomChatImage(edit(), 'nothing').zoom).toBe(1)
  })

  it('moves the cutout by pixels of the picture, as far as the picture reaches', () => {
    // at size 2 a 4000-pixel picture leaves 1000 pixels of room to each side
    const moved = panChatImage(edit({ zoom: 2 }), 4000, 3000, 500, -375)
    expect(moved.panX).toBeCloseTo(0.5)
    expect(moved.panY).toBeCloseTo(-0.5)
    expect(panChatImage(edit({ zoom: 2 }), 4000, 3000, 99999, -99999)).toMatchObject({
      panX: 1,
      panY: -1,
    })
  })

  it('does not move a cutout that already holds the whole picture', () => {
    expect(panChatImage(edit(), 4000, 3000, 300, 300)).toMatchObject({ panX: 0, panY: 0 })
    // a square of a landscape photo moves sideways only
    const square = panChatImage(edit({ shape: 'square' }), 4000, 3000, 250, 250)
    expect(square.panX).toBeCloseTo(0.5)
    expect(square.panY).toBe(0)
  })
})

describe('drawChatImageCut', () => {
  const photo = { width: 400, height: 300 }
  /** Where the corners of the picture land when the cutout is drawn into `target`. */
  const corners = (changes, target) => {
    const context = measuringContext()
    drawChatImageCut(context, photo, 400, 300, edit(changes), target)
    return {
      topLeft: context.drawn(0, 0),
      topRight: context.drawn(400, 0),
      bottomLeft: context.drawn(0, 300),
      bottomRight: context.drawn(400, 300),
    }
  }

  it('draws the picture as chosen into the target, corner to corner', () => {
    expect(corners({}, { x: 10, y: 20, width: 800, height: 600 })).toEqual({
      topLeft: [10, 20],
      topRight: [810, 20],
      bottomLeft: [10, 620],
      bottomRight: [810, 620],
    })
  })

  // A quarter turn clockwise: the picture's left edge becomes the top.
  it('turns clockwise', () => {
    expect(corners({ turn: 90 }, { x: 0, y: 0, width: 300, height: 400 })).toEqual({
      topLeft: [300, 0],
      topRight: [300, 400],
      bottomLeft: [0, 0],
      bottomRight: [0, 400],
    })
  })

  it('mirrors left to right', () => {
    expect(corners({ mirrored: true }, { x: 0, y: 0, width: 400, height: 300 })).toEqual({
      topLeft: [400, 0],
      topRight: [0, 0],
      bottomLeft: [400, 300],
      bottomRight: [0, 300],
    })
  })

  // ⛔ Left to right on the SCREEN after the turn -- not along the picture's own axis, which after a
  // quarter turn would be top to bottom.
  it('mirrors on the screen after the turn, not along the turned picture', () => {
    expect(corners({ turn: 90, mirrored: true }, { x: 0, y: 0, width: 300, height: 400 })).toEqual({
      topLeft: [0, 0],
      topRight: [0, 400],
      bottomLeft: [300, 0],
      bottomRight: [300, 400],
    })
  })

  // The cutout -- here the right half of the picture's middle -- fills the target exactly; the rest
  // of the picture lies around it.
  it('puts the cutout on the target and the rest of the picture around it', () => {
    const cut = edit({ zoom: 2, panX: 1, panY: 0 })
    const context = measuringContext()
    drawChatImageCut(context, photo, 400, 300, cut, { x: 0, y: 0, width: 200, height: 150 })
    const measured = chatImageCut(400, 300, cut)
    const left = measured.centerX - measured.width / 2
    const top = measured.centerY - measured.height / 2
    expect(context.drawn(left, top)).toEqual([0, 0])
    expect(context.drawn(left + measured.width, top + measured.height)).toEqual([200, 150])
    expect(context.drawn(0, 0)).toEqual([-200, -75])
  })

  // A smaller copy in the same proportions lands on the same place: it is drawn at the picture's size.
  it('draws a smaller copy of the picture at the picture’s own size', () => {
    const context = measuringContext()
    const copy = { width: 100, height: 75 }
    drawChatImageCut(context, copy, 400, 300, edit(), { x: 0, y: 0, width: 800, height: 600 })
    expect(context.drawn(100, 75)).toEqual([800, 600])
  })
})
