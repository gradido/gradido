// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { emojiGridStep } from './emojiGridKeys'

const key = (name, modifiers = {}) => ({ key: name, ...modifiers })
const AT = { row: 2, column: 3 }

describe('emojiGridStep', () => {
  it.each([
    ['ArrowRight', { row: 2, column: 4 }],
    ['ArrowLeft', { row: 2, column: 2 }],
    ['ArrowDown', { row: 3, column: 3 }],
    ['ArrowUp', { row: 1, column: 3 }],
  ])('%s is one step', (name, next) => {
    expect(emojiGridStep(AT, key(name), 8)).toEqual(next)
  })

  it('takes Home and End to the ends of the row, by its length', () => {
    expect(emojiGridStep(AT, key('Home'), 8)).toEqual({ row: 2, column: 0 })
    expect(emojiGridStep(AT, key('End'), 8)).toEqual({ row: 2, column: 7 })
    expect(emojiGridStep(AT, key('End'), 7)).toEqual({ row: 2, column: 6 })
  })

  // Beyond an edge there is no emoji; whoever asks finds none there and stays.
  it('names the place beyond an edge as it is', () => {
    expect(emojiGridStep({ row: 0, column: 0 }, key('ArrowUp'), 8)).toEqual({ row: -1, column: 0 })
    expect(emojiGridStep({ row: 0, column: 7 }, key('ArrowRight'), 8)).toEqual({
      row: 0,
      column: 8,
    })
  })

  it.each(['Enter', ' ', 'Tab', 'Escape', 'a', 'PageDown'])('leaves %j alone', (name) => {
    expect(emojiGridStep(AT, key(name), 8)).toBeNull()
  })

  // With a modifier they are the browser's own keys: back in the history, the start of the page.
  it.each([['altKey'], ['ctrlKey'], ['metaKey']])('leaves the keys alone with %s', (modifier) => {
    for (const name of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
      expect(emojiGridStep(AT, key(name, { [modifier]: true }), 8)).toBeNull()
    }
  })

  it('moves with Shift held as without', () => {
    expect(emojiGridStep(AT, key('ArrowRight', { shiftKey: true }), 8)).toEqual({
      row: 2,
      column: 4,
    })
  })

  it('does not change the place it is handed', () => {
    const at = { row: 1, column: 1 }
    emojiGridStep(at, key('ArrowDown'), 8)
    expect(at).toEqual({ row: 1, column: 1 })
  })
})
