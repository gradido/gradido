// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { chatReadingPlace, chatReadingPlaceOffset } from './chatReadingPlace'

/**
 * A thread as a browser lays it out, as far as the place needs it: a box whose top edge stands
 * at `boxTop` on the screen, scrolled by `scrolled`, and its items under one another -- each
 * `[gap before it, its height]`. jsdom lays nothing out, so the rectangles are said here.
 */
const thread = (rows, { boxTop = 100, scrolled = 0 } = {}) => {
  const box = { getBoundingClientRect: () => ({ top: boxTop }) }
  let y = boxTop - scrolled
  const items = rows.map(([gap, height], index) => {
    y += gap
    const top = y
    y += height
    return {
      dataset: { key: `m${index + 1}` },
      getBoundingClientRect: () => ({ top, height }),
    }
  })
  return { box, items }
}

describe('chatReadingPlace', () => {
  it('names the item the top edge stands in, and the share of it above the edge', () => {
    // Three items of 200 px, no gaps; scrolled 300: the edge stands half-way into the second.
    const { box, items } = thread(
      [
        [0, 200],
        [0, 200],
        [0, 200],
      ],
      { scrolled: 300 },
    )
    expect(chatReadingPlace(box, items)).toEqual({ key: 'm2', into: 0.5, before: 0 })
  })

  it('names an item that begins exactly at the edge, with nothing of it above', () => {
    const { box, items } = thread(
      [
        [0, 200],
        [0, 200],
      ],
      { scrolled: 200 },
    )
    expect(chatReadingPlace(box, items)).toEqual({ key: 'm2', into: 0, before: 0 })
  })

  // The edge in the room before an item (a day's date, the gap between two bubbles): the next
  // item, and the pixels up to it.
  it('names the next item and the room before it where the edge stands in a gap', () => {
    const { box, items } = thread(
      [
        [0, 200],
        [30, 200],
      ],
      { scrolled: 210 },
    )
    expect(chatReadingPlace(box, items)).toEqual({ key: 'm2', into: 0, before: 20 })
  })

  it('names the first item of a thread that is not scrolled', () => {
    const { box, items } = thread([
      [12, 80],
      [8, 80],
    ])
    expect(chatReadingPlace(box, items)).toEqual({ key: 'm1', into: 0, before: 12 })
  })

  // An item that ends exactly at the edge is above it: the reader sees none of it.
  it('passes over an item that ends at the edge', () => {
    const { box, items } = thread(
      [
        [0, 200],
        [0, 200],
      ],
      { scrolled: 200 },
    )
    expect(chatReadingPlace(box, items).key).toBe('m2')
  })

  it('names nothing where no item reaches below the edge', () => {
    const { box, items } = thread([[0, 200]], { scrolled: 500 })
    expect(chatReadingPlace(box, items)).toBeNull()
    expect(chatReadingPlace(box, [])).toBeNull()
  })

  // An item without a height (not laid out) has no share to speak of.
  it('takes no share of an item without a height', () => {
    const { box, items } = thread([[0, 0]], { scrolled: -10 })
    expect(chatReadingPlace(box, items)).toEqual({ key: 'm1', into: 0, before: 10 })
  })
})

describe('chatReadingPlaceOffset', () => {
  /**
   * The window got wider: every item is half as high as before. The reader stood half-way into
   * the second of three; the box, left at its 300 px, would now show the end of the third.
   */
  it('says how far to scroll for the place to stand at the edge again', () => {
    const before = thread(
      [
        [0, 200],
        [0, 200],
        [0, 200],
      ],
      { scrolled: 300 },
    )
    const place = chatReadingPlace(before.box, before.items)

    const after = thread(
      [
        [0, 100],
        [0, 100],
        [0, 100],
      ],
      { scrolled: 300 },
    )
    // Half-way into the second item is 150 px down now: 150 px back up from 300.
    expect(chatReadingPlaceOffset(after.box, after.items[1], place)).toBe(-150)
  })

  it('scrolls down where the items got higher', () => {
    const before = thread(
      [
        [0, 100],
        [0, 100],
        [0, 100],
      ],
      { scrolled: 150 },
    )
    const place = chatReadingPlace(before.box, before.items)

    const after = thread(
      [
        [0, 200],
        [0, 200],
        [0, 200],
      ],
      { scrolled: 150 },
    )
    expect(chatReadingPlaceOffset(after.box, after.items[1], place)).toBe(150)
  })

  // The room before an item does not reflow: it is kept as it was, in pixels.
  it('keeps the room before an item as it was', () => {
    const before = thread(
      [
        [0, 200],
        [30, 200],
      ],
      { scrolled: 210 },
    )
    const place = chatReadingPlace(before.box, before.items)

    const after = thread(
      [
        [0, 100],
        [30, 100],
      ],
      { scrolled: 210 },
    )
    // The second item begins 130 px down; with 20 px of room before it the edge stands at 110.
    expect(chatReadingPlaceOffset(after.box, after.items[1], place)).toBe(-100)
  })

  it('asks for nothing where nothing changed', () => {
    const { box, items } = thread(
      [
        [0, 200],
        [0, 200],
      ],
      { scrolled: 250 },
    )
    const place = chatReadingPlace(box, items)
    expect(chatReadingPlaceOffset(box, items[1], place)).toBe(0)
  })
})
