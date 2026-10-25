// AI-GENERATED — not an architecture reference

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ROW_HOLD_MS, rollToRowAndHold } from './wayBackView'

// ⭐ Bernd, 25.10.2026: in the app on an iPhone the page came back from the wallet at the row,
// "kurz der richtige Bildschirm", and then stood at its top again.
describe('rollToRowAndHold', () => {
  let row
  // Where the row stands in the window: far down, until a roll brings it to the top.
  let top
  let scroll

  const moveAway = () => {
    top = 508
  }

  beforeEach(() => {
    vi.useFakeTimers()
    row = document.createElement('tr')
    row.dataset.contributionId = '501'
    row.getBoundingClientRect = () => ({ top })
    document.body.appendChild(row)
    top = 500
    scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      top = 8
    })
  })

  afterEach(() => {
    // Ends whatever holding a test left running.
    vi.runAllTimers()
    vi.useRealTimers()
    row.remove()
    scroll.mockRestore()
  })

  it('rolls to the row', () => {
    expect(rollToRowAndHold('[data-contribution-id="501"]')).toBe(true)
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(top).toBe(8)
  })

  it('rolls back to it when the window is moved away without the moderator doing it', () => {
    rollToRowAndHold('[data-contribution-id="501"]')
    moveAway()
    window.dispatchEvent(new Event('scroll'))
    expect(scroll).toHaveBeenCalledTimes(2)
    expect(top).toBe(8)
  })

  // WebKit may move the window without a scroll event reaching the page in time.
  it('rolls back as well where the move brings no scroll event along', () => {
    rollToRowAndHold('[data-contribution-id="501"]')
    moveAway()
    vi.advanceTimersByTime(300)
    expect(scroll).toHaveBeenCalledTimes(2)
  })

  it('keeps checking for such a move until the holding ends', () => {
    rollToRowAndHold('[data-contribution-id="501"]')
    vi.advanceTimersByTime(1500)
    moveAway()
    vi.advanceTimersByTime(300)
    expect(scroll).toHaveBeenCalledTimes(2)
    expect(top).toBe(8)
  })

  it('leaves small moves alone', () => {
    rollToRowAndHold('[data-contribution-id="501"]')
    top = 20
    window.dispatchEvent(new Event('scroll'))
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it.each(['touchstart', 'pointerdown', 'wheel', 'keydown'])(
    'never undoes the moderator’s own scrolling: %s ends the holding',
    (type) => {
      rollToRowAndHold('[data-contribution-id="501"]')
      window.dispatchEvent(new Event(type))
      moveAway()
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(1000)
      expect(scroll).toHaveBeenCalledTimes(1)
    },
  )

  it('ends after a few seconds', () => {
    rollToRowAndHold('[data-contribution-id="501"]')
    vi.advanceTimersByTime(ROW_HOLD_MS)
    moveAway()
    window.dispatchEvent(new Event('scroll'))
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it('ends when the row is gone', () => {
    rollToRowAndHold('[data-contribution-id="501"]')
    row.remove()
    window.dispatchEvent(new Event('scroll'))
    document.body.appendChild(row)
    moveAway()
    window.dispatchEvent(new Event('scroll'))
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it('holds nothing where there is no row', () => {
    expect(rollToRowAndHold('[data-contribution-id="999"]')).toBe(false)
    moveAway()
    window.dispatchEvent(new Event('scroll'))
    expect(scroll).not.toHaveBeenCalled()
  })
})
