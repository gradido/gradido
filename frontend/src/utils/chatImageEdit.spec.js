// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import {
  CHAT_IMAGE_FULL_MAX_PIXELS,
  CHAT_IMAGE_SHAPES,
  CHAT_IMAGE_CATCH_STEPS,
  CHAT_IMAGE_FIT_STEPS,
  CHAT_IMAGE_UNEDITED,
  CHAT_IMAGE_ZOOM_MAX,
  caughtFramedSliderSteps,
  chatImageCut,
  chatImageCutSize,
  chatImageZoomMin,
  drawChatImageCut,
  framedChatImageEdit,
  framedSliderOfZoom,
  framedSliderRange,
  mirrorChatImage,
  panChatImage,
  shapeChatImage,
  turnChatImage,
  turnedSize,
  zoomChatImage,
  zoomChatImageInFrame,
  zoomOfFramedSlider,
  zoomStoppingAtFrameFill,
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

/**
 * A picture cut under a frame of its own -- the card of a thank-you greeting, 36 : 25 -- instead
 * of one of the chat's four shapes: it fills the frame at size 1 and may be made smaller than
 * that, down to where the whole picture stands in the frame.
 */
describe('a frame of its own', () => {
  const FRAME = 36 / 25
  const GROUND = '#fbf3de'
  const framed = (changes = {}) => ({ ...framedChatImageEdit(FRAME, GROUND), ...changes })
  const near = (value, digits = 6) => Number(value.toFixed(digits))

  it('starts as the picture chosen, with the frame and its ground beside it', () => {
    expect(framedChatImageEdit(FRAME, GROUND)).toEqual({
      ...CHAT_IMAGE_UNEDITED,
      frame: FRAME,
      ground: GROUND,
    })
    expect(Object.isFrozen(framedChatImageEdit(FRAME, GROUND))).toBe(true)
  })

  it('cuts in the frame’s shape, whatever shape the edit names', () => {
    for (const shape of Object.keys(CHAT_IMAGE_SHAPES)) {
      expect(chatImageCut(3000, 4000, framed({ shape })).aspect).toBe(FRAME)
    }
  })

  // The picture opens filling the frame: the largest rectangle of the frame's shape, in the middle.
  it('fills the frame at size 1 -- a portrait loses top and bottom, a wide picture its sides', () => {
    const portrait = chatImageCut(3000, 4000, framed())
    expect([near(portrait.width), near(portrait.height)]).toEqual([3000, near(3000 / FRAME)])
    expect([portrait.centerX, portrait.centerY]).toEqual([1500, 2000])

    const wide = chatImageCut(4000, 1000, framed())
    expect([near(wide.width), near(wide.height)]).toEqual([near(1000 * FRAME), 1000])
    expect([wide.centerX, wide.centerY]).toEqual([2000, 500])
  })

  describe('chatImageZoomMin', () => {
    it('is the size at which the whole picture stands in the frame', () => {
      // A portrait of 3 : 4 -- the phone's photo: 0.52.
      expect(near(chatImageZoomMin(3000, 4000, framed()), 4)).toBe(0.5208)
      // A landscape of 4 : 3, a little narrower than the frame.
      expect(near(chatImageZoomMin(4000, 3000, framed()), 4)).toBe(0.9259)
      // A very wide one, 4 : 1.
      expect(near(chatImageZoomMin(4000, 1000, framed()), 4)).toBe(0.36)
    })

    it('is 1 for a picture of the frame’s own shape', () => {
      expect(chatImageZoomMin(3600, 2500, framed())).toBe(1)
    })

    // A quarter turn makes a landscape a portrait: the smallest size follows the picture as seen.
    it('follows the turn', () => {
      expect(near(chatImageZoomMin(4000, 3000, framed({ turn: 90 })), 4)).toBe(0.5208)
      expect(near(chatImageZoomMin(3000, 4000, framed({ turn: 90 })), 4)).toBe(0.9259)
      expect(near(chatImageZoomMin(3000, 4000, framed({ turn: 180 })), 4)).toBe(0.5208)
    })

    it('holds the whole picture exactly: the cutout is as high as a portrait, as wide as a wide one', () => {
      const portrait = chatImageCut(
        3000,
        4000,
        framed({ zoom: chatImageZoomMin(3000, 4000, framed()) }),
      )
      expect(near(portrait.height)).toBe(4000)
      expect(near(portrait.width)).toBe(near(4000 * FRAME))

      const wide = chatImageCut(
        4000,
        1000,
        framed({ zoom: chatImageZoomMin(4000, 1000, framed()) }),
      )
      expect(near(wide.width)).toBe(4000)
      expect(near(wide.height)).toBe(near(4000 / FRAME))
    })

    // ⛔ The chat's editor keeps its bound: an edit without a frame of its own starts at 1.
    it('is 1 for the chat’s shapes, whatever the picture', () => {
      for (const shape of Object.keys(CHAT_IMAGE_SHAPES)) {
        expect(chatImageZoomMin(3000, 4000, edit({ shape }))).toBe(1)
        expect(chatImageZoomMin(4000, 1000, edit({ shape, turn: 90 }))).toBe(1)
      }
    })
  })

  describe('zoomChatImageInFrame', () => {
    it('keeps the size between the whole picture and four times', () => {
      const min = chatImageZoomMin(3000, 4000, framed())
      expect(zoomChatImageInFrame(framed(), 3000, 4000, 0.1).zoom).toBe(min)
      expect(zoomChatImageInFrame(framed(), 3000, 4000, 0.7).zoom).toBe(0.7)
      expect(zoomChatImageInFrame(framed(), 3000, 4000, 2.5).zoom).toBe(2.5)
      expect(zoomChatImageInFrame(framed(), 3000, 4000, 9).zoom).toBe(CHAT_IMAGE_ZOOM_MAX)
      expect(zoomChatImageInFrame(framed(), 3000, 4000, 'nonsense').zoom).toBe(1)
    })

    it('goes no smaller than 1 for a picture of the frame’s own shape', () => {
      expect(zoomChatImageInFrame(framed(), 3600, 2500, 0.5).zoom).toBe(1)
    })

    // ⛔ A place the picture was moved to while it was larger must not push it out of the middle
    // once it is smaller than the frame there.
    it('lets a place go in the direction the picture no longer fills', () => {
      // A portrait made larger and moved to the top right corner: room both ways.
      const inTheCorner = framed({ zoom: 2, panX: 1, panY: -1 })
      // Smaller than the frame is wide, still taller than it is high: sideways it stands in the
      // middle, up and down it keeps its place.
      const narrower = zoomChatImageInFrame(inTheCorner, 3000, 4000, 0.6)
      expect([narrower.panX, narrower.panY]).toEqual([0, -1])
      expect(chatImageCut(3000, 4000, narrower).centerX).toBe(1500)
      // The whole picture in the frame: no room either way, the middle of the frame.
      const whole = zoomChatImageInFrame(inTheCorner, 3000, 4000, 0)
      expect([whole.panX, whole.panY]).toEqual([0, 0])
      const cut = chatImageCut(3000, 4000, whole)
      expect([cut.centerX, cut.centerY]).toEqual([1500, 2000])
    })

    it('keeps the place in a direction that still has room', () => {
      // Larger than the frame both ways: both places stay.
      const moved = framed({ zoom: 2, panX: 0.5, panY: -1 })
      const still = zoomChatImageInFrame(moved, 3000, 4000, 1.5)
      expect([still.panX, still.panY]).toEqual([0.5, -1])
      // At size 1 a portrait has room up and down only.
      const atOne = zoomChatImageInFrame(moved, 3000, 4000, 1)
      expect([atOne.panX, atOne.panY]).toEqual([0, -1])
    })

    it('cannot be moved in a direction it is smaller than the frame in', () => {
      // Between "whole" and "fills": a portrait is narrower than the frame and still taller.
      const narrower = zoomChatImageInFrame(framed(), 3000, 4000, 0.6)
      const pushed = panChatImage(narrower, 3000, 4000, 500, 100)
      expect(pushed.panX).toBe(0)
      expect(pushed.panY).toBeGreaterThan(0)
      // The whole picture: it stands in the middle and stays there.
      const whole = zoomChatImageInFrame(framed(), 3000, 4000, 0)
      const pushedWhole = panChatImage(whole, 3000, 4000, 500, 500)
      expect([pushedWhole.panX, pushedWhole.panY]).toEqual([0, 0])
    })

    it('keeps the frame, the ground, the turn and the mirror', () => {
      const turned = framed({ turn: 90, mirrored: true })
      expect(zoomChatImageInFrame(turned, 4000, 3000, 0.7)).toMatchObject({
        frame: FRAME,
        ground: GROUND,
        turn: 90,
        mirrored: true,
      })
    })
  })

  describe('the tools under a frame', () => {
    it('turning starts over at the size that fills the frame, and keeps the frame', () => {
      const turned = turnChatImage(framed({ zoom: 0.6, panY: 0.3 }))
      expect(turned).toMatchObject({ turn: 90, zoom: 1, panX: 0, panY: 0, frame: FRAME })
      expect(turned.ground).toBe(GROUND)
    })

    it('mirroring keeps size, frame and ground', () => {
      expect(mirrorChatImage(framed({ zoom: 0.6 }))).toMatchObject({
        mirrored: true,
        zoom: 0.6,
        frame: FRAME,
        ground: GROUND,
      })
    })
  })

  describe('zoomStoppingAtFrameFill', () => {
    it('stops at "fills the frame" where a step would pass it, from either side', () => {
      expect(zoomStoppingAtFrameFill(0.77, 1.02)).toBe(1)
      expect(zoomStoppingAtFrameFill(1.1, 0.9)).toBe(1)
    })

    it('goes on from there, and takes every step that does not pass it', () => {
      expect(zoomStoppingAtFrameFill(1, 1.25)).toBe(1.25)
      expect(zoomStoppingAtFrameFill(1, 0.75)).toBe(0.75)
      expect(zoomStoppingAtFrameFill(0.52, 0.77)).toBe(0.77)
      expect(zoomStoppingAtFrameFill(2, 1.75)).toBe(1.75)
      expect(zoomStoppingAtFrameFill(0.75, 1)).toBe(1)
    })
  })

  // The slider counts steps from the size that fills the frame: 0 is that size, the left end the
  // whole picture, the right end four times the size.
  describe('the slider under a frame', () => {
    const PORTRAIT_MIN = chatImageZoomMin(3000, 4000, framed())

    it('runs from the whole picture, a hundred steps left of "fills the frame", to four times', () => {
      expect(framedSliderRange(PORTRAIT_MIN)).toEqual({ min: -CHAT_IMAGE_FIT_STEPS, max: 300 })
      expect(CHAT_IMAGE_FIT_STEPS).toBe(100)
    })

    it('begins at "fills the frame" for a picture of the frame’s own shape', () => {
      expect(framedSliderRange(1)).toEqual({ min: 0, max: 300 })
    })

    it('stands for exactly 1 at its zero, the smallest size at its left end, four at its right', () => {
      expect(zoomOfFramedSlider(0, PORTRAIT_MIN)).toBe(1)
      expect(zoomOfFramedSlider(-CHAT_IMAGE_FIT_STEPS, PORTRAIT_MIN)).toBeCloseTo(PORTRAIT_MIN, 12)
      expect(zoomOfFramedSlider(300, PORTRAIT_MIN)).toBeCloseTo(CHAT_IMAGE_ZOOM_MAX, 12)
      // Past its left end there is nothing smaller.
      expect(zoomOfFramedSlider(-150, PORTRAIT_MIN)).toBeCloseTo(PORTRAIT_MIN, 12)
    })

    it('grows by a hundredth a step to the right, as the chat’s slider does', () => {
      expect(zoomOfFramedSlider(1, PORTRAIT_MIN)).toBeCloseTo(1.01, 12)
      expect(zoomOfFramedSlider(150, PORTRAIT_MIN)).toBeCloseTo(2.5, 12)
    })

    it('shrinks evenly to the left, whatever the picture’s shape', () => {
      expect(zoomOfFramedSlider(-50, PORTRAIT_MIN)).toBeCloseTo((1 + PORTRAIT_MIN) / 2, 12)
      const wideMin = chatImageZoomMin(4000, 1000, framed())
      expect(zoomOfFramedSlider(-50, wideMin)).toBeCloseTo((1 + wideMin) / 2, 12)
    })

    it('finds the place of a size again', () => {
      for (const steps of [-100, -73, -1, 0, 1, 42, 300]) {
        expect(framedSliderOfZoom(zoomOfFramedSlider(steps, PORTRAIT_MIN), PORTRAIT_MIN)).toBe(
          steps,
        )
      }
      // A size the wheel left between two steps stands at the nearer one.
      expect(framedSliderOfZoom(1.234, PORTRAIT_MIN)).toBe(23)
      expect(framedSliderOfZoom(1, 1)).toBe(0)
      expect(framedSliderOfZoom(1.5, 1)).toBe(50)
    })

    describe('the catch at "fills the frame"', () => {
      it('catches a hand that comes near it from further away, from either side', () => {
        expect(caughtFramedSliderSteps(CHAT_IMAGE_CATCH_STEPS, true)).toBe(0)
        expect(caughtFramedSliderSteps(-CHAT_IMAGE_CATCH_STEPS, true)).toBe(0)
        expect(caughtFramedSliderSteps(3, true)).toBe(0)
        expect(caughtFramedSliderSteps(0, true)).toBe(0)
      })

      it('lets a hand pass that is not near it', () => {
        expect(caughtFramedSliderSteps(CHAT_IMAGE_CATCH_STEPS + 1, true)).toBe(
          CHAT_IMAGE_CATCH_STEPS + 1,
        )
        expect(caughtFramedSliderSteps(-60, true)).toBe(-60)
      })

      // ⛔ A hand that takes the slider AT that place is followed step by step: the sizes next to
      // "fills the frame" could not be chosen otherwise, and a key would never get away from it.
      it('follows a hand that started there and has not been away', () => {
        for (const steps of [1, -1, 5, -CHAT_IMAGE_CATCH_STEPS]) {
          expect(caughtFramedSliderSteps(steps, false)).toBe(steps)
        }
      })
    })
  })

  describe('drawChatImageCut', () => {
    const photo = { width: 300, height: 400 }
    const target = { x: 0, y: 0, width: 360, height: 250 }
    const cornersOf = (edited) => {
      const context = measuringContext()
      drawChatImageCut(context, photo, 300, 400, edited, target)
      return {
        topLeft: context.drawn(0, 0).map((n) => near(n, 2)),
        bottomRight: context.drawn(300, 400).map((n) => near(n, 2)),
      }
    }

    // At size 1 a portrait covers the frame from side to side; top and bottom lie outside it.
    it('fills the frame at size 1', () => {
      expect(cornersOf(framed())).toEqual({ topLeft: [0, -115], bottomRight: [360, 365] })
    })

    // The whole picture, in the middle: from top to bottom of the frame, a margin left and right
    // that the caller's ground shows in.
    it('stands the whole picture in the middle of the frame at the smallest size', () => {
      const whole = zoomChatImageInFrame(framed(), 300, 400, 0)
      expect(cornersOf(whole)).toEqual({ topLeft: [86.25, 0], bottomRight: [273.75, 250] })
    })

    it('stands a wide picture in the middle with a margin above and below', () => {
      const context = measuringContext()
      const wide = zoomChatImageInFrame(framed(), 400, 100, 0)
      drawChatImageCut(context, { width: 400, height: 100 }, 400, 100, wide, target)
      expect(context.drawn(0, 0).map((n) => near(n, 2))).toEqual([0, 80])
      expect(context.drawn(400, 100).map((n) => near(n, 2))).toEqual([360, 170])
    })

    it('keeps the turned picture whole in the frame as well', () => {
      // A landscape turned a quarter is a portrait: its smallest size is the portrait's.
      const turned = zoomChatImageInFrame(framed({ turn: 90 }), 400, 300, 0)
      const context = measuringContext()
      drawChatImageCut(context, { width: 400, height: 300 }, 400, 300, turned, target)
      const byNumber = (a, b) => a - b
      const xs = [context.drawn(0, 0)[0], context.drawn(400, 300)[0]]
        .map((n) => near(n, 2))
        .sort(byNumber)
      const ys = [context.drawn(0, 0)[1], context.drawn(400, 300)[1]]
        .map((n) => near(n, 2))
        .sort(byNumber)
      expect(xs).toEqual([86.25, 273.75])
      expect(ys).toEqual([0, 250])
    })
  })
})

// ⛔ The chat's own edits know no frame: every function reads them as before.
describe('an edit without a frame of its own', () => {
  it('is cut in the shape it names, as before', () => {
    expect(chatImageCut(3000, 4000, edit({ shape: 'landscape' })).aspect).toBe(4 / 3)
    expect(chatImageCut(3000, 4000, edit({ shape: 'original' })).aspect).toBe(3000 / 4000)
    expect('frame' in CHAT_IMAGE_UNEDITED).toBe(false)
    expect('ground' in CHAT_IMAGE_UNEDITED).toBe(false)
  })

  it('keeps its size at 1 or more', () => {
    expect(zoomChatImage(edit(), 0.5).zoom).toBe(1)
  })
})
