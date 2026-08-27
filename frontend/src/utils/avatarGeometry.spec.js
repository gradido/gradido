// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import {
  applyCrop,
  avatarCrop,
  centeredOffsets,
  mirroredOffsetX,
  nextRotation,
} from './avatarGeometry'

// The cropper's frame, and a landscape source. Every expected number below is worked out
// by hand from these two, never read back out of avatarCrop -- a value compared against
// something the same function computed cannot notice that both have moved.
//
//   minScale = 280 / 900        = 0.3111111...   (frame / shorter edge)
//   drawWidth  = 1200 * minScale = 373.33333
//   drawHeight =  900 * minScale = 280
const FRAME = 280
const WIDE = { sourceWidth: 1200, sourceHeight: 900 }

const MIN_SCALE = 0.3111111
const DRAW_WIDTH = 373.33333
const DRAW_HEIGHT = 280
// (280 - 373.33333) / 2
const CENTERED = -46.666667

describe('nextRotation', () => {
  it('steps a quarter turn clockwise', () => {
    expect(nextRotation(0)).toBe(90)
    expect(nextRotation(90)).toBe(180)
    expect(nextRotation(180)).toBe(270)
  })

  it('is back at the start after four presses', () => {
    expect(nextRotation(nextRotation(nextRotation(nextRotation(0))))).toBe(0)
  })
})

describe('avatarCrop, the size that covers the frame', () => {
  it('scales the shorter edge onto the frame', () => {
    expect(avatarCrop({ ...WIDE, frame: FRAME }).minScale).toBeCloseTo(MIN_SCALE, 5)
  })

  // A quarter turn only swaps which edge is called width, so the scale cannot move. If it
  // ever does, the picture jumps in size the moment somebody turns it.
  it('does not change with the rotation', () => {
    const scales = [0, 90, 180, 270].map(
      (rotation) => avatarCrop({ ...WIDE, rotation, frame: FRAME }).minScale,
    )
    for (const scale of scales) {
      expect(scale).toBeCloseTo(MIN_SCALE, 5)
    }
  })

  // The frame must never show white: that would be encoded into the stored JPEG, not just
  // look wrong on screen.
  it.each([0, 90, 180, 270])('covers the frame at rotation %i', (rotation) => {
    const geometry = avatarCrop({ ...WIDE, rotation, frame: FRAME })
    expect(geometry.effectiveWidth * geometry.minScale).toBeGreaterThanOrEqual(FRAME - 0.001)
    expect(geometry.effectiveHeight * geometry.minScale).toBeGreaterThanOrEqual(FRAME - 0.001)
  })

  it('swaps width and height on a quarter turn', () => {
    const upright = avatarCrop({ ...WIDE, rotation: 0, frame: FRAME })
    expect(upright.effectiveWidth).toBe(1200)
    expect(upright.effectiveHeight).toBe(900)

    const turned = avatarCrop({ ...WIDE, rotation: 90, frame: FRAME })
    expect(turned.effectiveWidth).toBe(900)
    expect(turned.effectiveHeight).toBe(1200)
  })
})

describe('avatarCrop, holding the picture over the frame', () => {
  it('does not let the picture slide off to the right', () => {
    expect(avatarCrop({ ...WIDE, offsetX: 50, frame: FRAME }).offsetX).toBe(0)
  })

  // 280 - 373.33333
  it('does not let the picture slide off to the left', () => {
    expect(avatarCrop({ ...WIDE, offsetX: -200, frame: FRAME }).offsetX).toBeCloseTo(-93.33333, 4)
  })

  it('pins an edge that exactly fits, whatever is asked for', () => {
    // The height is exactly the frame at zoom 1, so there is nowhere to move.
    expect(avatarCrop({ ...WIDE, offsetY: -30, frame: FRAME }).offsetY).toBe(0)
    expect(avatarCrop({ ...WIDE, offsetY: 30, frame: FRAME }).offsetY).toBe(0)
  })
})

describe('centeredOffsets', () => {
  it('centres a landscape picture sideways and pins it vertically', () => {
    const { offsetX, offsetY } = centeredOffsets({ ...WIDE, frame: FRAME })
    expect(offsetX).toBeCloseTo(CENTERED, 4)
    expect(offsetY).toBeCloseTo(0, 6)
  })

  it('centres the other way round after a quarter turn', () => {
    const { offsetX, offsetY } = centeredOffsets({ ...WIDE, rotation: 90, frame: FRAME })
    expect(offsetX).toBeCloseTo(0, 6)
    expect(offsetY).toBeCloseTo(CENTERED, 4)
  })
})

describe('mirroredOffsetX', () => {
  it('keeps the visible part where it is', () => {
    // Visible window [0, 280] over a picture drawn from -46.66667 to 326.66667.
    // Mirrored, the same window has to start at 280 - 373.33333 - (-46.66667).
    expect(mirroredOffsetX({ ...WIDE, offsetX: CENTERED, frame: FRAME })).toBeCloseTo(CENTERED, 4)
    expect(mirroredOffsetX({ ...WIDE, offsetX: 0, frame: FRAME })).toBeCloseTo(-93.33333, 4)
  })

  // The flip is left-to-right on screen at every rotation (avatarCrop picks the source
  // axis for that), so it is always the horizontal offset that has to move -- measured
  // against effectiveWidth, which a quarter turn swaps.
  it('uses the turned width after a quarter turn', () => {
    // effectiveWidth at 90 is the source HEIGHT: 900 * 0.3111111 = 280, exactly the frame.
    expect(mirroredOffsetX({ ...WIDE, rotation: 90, offsetX: 0, frame: FRAME })).toBeCloseTo(0, 6)
  })

  it('is its own undo', () => {
    const once = mirroredOffsetX({ ...WIDE, offsetX: -20, frame: FRAME })
    expect(mirroredOffsetX({ ...WIDE, offsetX: once, frame: FRAME })).toBeCloseTo(-20, 6)
  })
})

describe('avatarCrop, the transform chain', () => {
  // ⛔ This case is the regression net for pulling the geometry out of the component: with
  // no turn and no mirror it has to be exactly what the old drawSquare did -- move to the
  // offset, draw the source at its scaled size.
  it('is a plain move when nothing is turned or mirrored', () => {
    const { steps, drawWidth, drawHeight } = avatarCrop({
      ...WIDE,
      offsetX: CENTERED,
      frame: FRAME,
    })
    expect(steps).toHaveLength(1)
    expect(steps[0][0]).toBe('translate')
    expect(steps[0][1]).toBeCloseTo(CENTERED, 4)
    expect(steps[0][2]).toBeCloseTo(0, 6)
    expect(drawWidth).toBeCloseTo(DRAW_WIDTH, 4)
    expect(drawHeight).toBeCloseTo(DRAW_HEIGHT, 4)
  })

  it('turns a quarter clockwise about the right corner', () => {
    const { steps } = avatarCrop({ ...WIDE, rotation: 90, offsetY: CENTERED, frame: FRAME })
    expect(steps.map(([name]) => name)).toEqual(['translate', 'translate', 'rotate'])
    // The turned picture is placed by its own height, then rotated.
    expect(steps[1][1]).toBeCloseTo(DRAW_HEIGHT, 4)
    expect(steps[1][2]).toBe(0)
    expect(steps[2][1]).toBeCloseTo(Math.PI / 2, 6)
  })

  it('turns a half about the far corner', () => {
    const { steps } = avatarCrop({ ...WIDE, rotation: 180, frame: FRAME })
    expect(steps[1][1]).toBeCloseTo(DRAW_WIDTH, 4)
    expect(steps[1][2]).toBeCloseTo(DRAW_HEIGHT, 4)
    expect(steps[2][1]).toBeCloseTo(Math.PI, 6)
  })

  it('turns three quarters about the near corner', () => {
    const { steps } = avatarCrop({ ...WIDE, rotation: 270, frame: FRAME })
    expect(steps[1][1]).toBe(0)
    expect(steps[1][2]).toBeCloseTo(DRAW_WIDTH, 4)
    expect(steps[2][1]).toBeCloseTo(-Math.PI / 2, 6)
  })

  // Mirroring is the innermost step: it flips the SOURCE about its own axis, inside
  // whatever rotation is in force. Flipping the finished square instead would send a
  // finger drag the wrong way.
  it('mirrors the source last, about its own width', () => {
    const { steps } = avatarCrop({ ...WIDE, mirrored: true, frame: FRAME })
    expect(steps.map(([name]) => name)).toEqual(['translate', 'translate', 'scale'])
    expect(steps[1][1]).toBeCloseTo(DRAW_WIDTH, 4)
    expect(steps[2][1]).toBe(-1)
    expect(steps[2][2]).toBe(1)
  })

  // ⛔ The gap that let a real defect through: mirroring was only ever asserted at
  // rotation 0. The mirror runs in the SOURCE's frame, and a quarter turn maps the
  // source's x axis onto the frame's y axis -- so flipping about x after a quarter turn
  // stands the picture on its head instead of turning it left to right. Measured in a
  // browser before and after: at 90 degrees the corners swapped top for bottom.
  it('flips the source about its other axis after a quarter turn', () => {
    const { steps } = avatarCrop({ ...WIDE, rotation: 90, mirrored: true, frame: FRAME })
    const flip = steps[steps.length - 1]
    const before = steps[steps.length - 2]
    expect(flip).toEqual(['scale', 1, -1])
    expect(before[0]).toBe('translate')
    expect(before[1]).toBe(0)
    expect(before[2]).toBeCloseTo(DRAW_HEIGHT, 4)
  })

  it('does the same at three quarters', () => {
    const { steps } = avatarCrop({ ...WIDE, rotation: 270, mirrored: true, frame: FRAME })
    expect(steps[steps.length - 1]).toEqual(['scale', 1, -1])
  })

  it('keeps flipping about x at a half turn, where the axes still line up', () => {
    const { steps } = avatarCrop({ ...WIDE, rotation: 180, mirrored: true, frame: FRAME })
    expect(steps[steps.length - 1]).toEqual(['scale', -1, 1])
  })

  it('mirrors after turning, not before', () => {
    const { steps } = avatarCrop({ ...WIDE, rotation: 90, mirrored: true, frame: FRAME })
    expect(steps.map(([name]) => name)).toEqual([
      'translate',
      'translate',
      'rotate',
      'translate',
      'scale',
    ])
  })
})

describe('avatarCrop, one calculation for three surfaces', () => {
  // 512 / 280 = 1.8285714
  it('scales every length by the output size', () => {
    const preview = avatarCrop({ ...WIDE, offsetX: CENTERED, frame: FRAME })
    const stored = avatarCrop({ ...WIDE, offsetX: CENTERED, frame: FRAME, outputSize: 512 })
    const ratio = 512 / FRAME

    expect(stored.drawWidth).toBeCloseTo(preview.drawWidth * ratio, 4)
    expect(stored.steps[0][1]).toBeCloseTo(preview.steps[0][1] * ratio, 4)
    // -46.666667 * 1.8285714
    expect(stored.steps[0][1]).toBeCloseTo(-85.33333, 4)
  })

  // The offsets are frame-space and describe the same square whatever is drawn from them.
  it('picks the same square for the small rendition as for the large one', () => {
    const full = avatarCrop({ ...WIDE, offsetX: -20, frame: FRAME, outputSize: 512 })
    const small = avatarCrop({ ...WIDE, offsetX: -20, frame: FRAME, outputSize: 128 })
    expect(full.offsetX).toBeCloseTo(small.offsetX, 6)
    expect(full.drawWidth / 512).toBeCloseTo(small.drawWidth / 128, 6)
  })
})

describe('applyCrop', () => {
  const recorder = () => {
    const calls = []
    return {
      calls,
      setTransform: (...args) => calls.push(['setTransform', ...args]),
      fillRect: (...args) => calls.push(['fillRect', ...args]),
      save: () => calls.push(['save']),
      restore: () => calls.push(['restore']),
      translate: (...args) => calls.push(['translate', ...args]),
      rotate: (...args) => calls.push(['rotate', ...args]),
      scale: (...args) => calls.push(['scale', ...args]),
      drawImage: (...args) => calls.push(['drawImage', ...args.slice(1)]),
      // Getters alongside the setters: a canvas context has both, and the linter is right
      // that a write-only property is a shape nothing real has.
      _fillStyle: '',
      get fillStyle() {
        return this._fillStyle
      },
      set fillStyle(value) {
        this._fillStyle = value
        calls.push(['fillStyle', value])
      },
      _smoothing: '',
      get imageSmoothingQuality() {
        return this._smoothing
      },
      set imageSmoothingQuality(value) {
        this._smoothing = value
        calls.push(['smoothing', value])
      },
    }
  }

  it('walks the chain in order and then draws', () => {
    const context = recorder()
    const geometry = avatarCrop({ ...WIDE, rotation: 90, mirrored: true, frame: FRAME })
    applyCrop(context, {}, geometry, FRAME)

    const names = context.calls.map(([name]) => name)
    expect(names).toEqual([
      'setTransform',
      'fillStyle',
      'fillRect',
      'smoothing',
      'save',
      'translate',
      'translate',
      'rotate',
      'translate',
      'scale',
      'drawImage',
      'restore',
    ])
  })

  // Without the white ground a picture that does not fill the square keeps transparent
  // corners, and JPEG turns those black.
  it('lays down a white ground before drawing', () => {
    const context = recorder()
    applyCrop(context, {}, avatarCrop({ ...WIDE, frame: FRAME }), FRAME)
    expect(context.calls[1]).toEqual(['fillStyle', '#ffffff'])
    expect(context.calls[2]).toEqual(['fillRect', 0, 0, FRAME, FRAME])
  })

  it('draws the source at the size the geometry asked for', () => {
    const context = recorder()
    const geometry = avatarCrop({ ...WIDE, frame: FRAME, outputSize: 512 })
    applyCrop(context, {}, geometry, 512)
    const draw = context.calls.find(([name]) => name === 'drawImage')
    expect(draw[3]).toBeCloseTo(geometry.drawWidth, 6)
    expect(draw[4]).toBeCloseTo(geometry.drawHeight, 6)
  })

  it('spends the expensive downscaling only where it is wanted', () => {
    const stored = recorder()
    applyCrop(stored, {}, avatarCrop({ ...WIDE, frame: FRAME }), FRAME)
    expect(stored.calls).toContainEqual(['smoothing', 'high'])

    const preview = recorder()
    applyCrop(preview, {}, avatarCrop({ ...WIDE, frame: FRAME }), FRAME, false)
    expect(preview.calls).toContainEqual(['smoothing', 'low'])
  })
})
