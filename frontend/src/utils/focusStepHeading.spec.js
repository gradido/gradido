// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { focusStepHeading } from './focusStepHeading'

describe('focusStepHeading', () => {
  let heading
  let bar
  const place = (element, top, bottom) => {
    element.getBoundingClientRect = () => ({ top, bottom })
  }

  beforeEach(() => {
    heading = document.createElement('h2')
    heading.tabIndex = -1
    heading.scrollIntoView = vi.fn()
    document.body.append(heading)
    vi.stubGlobal('innerHeight', 800)
  })

  afterEach(() => {
    heading.remove()
    bar?.remove()
    bar = null
    vi.unstubAllGlobals()
  })

  const navbar = (position, bottom) => {
    bar = document.createElement('div')
    bar.className = 'navbar-element'
    bar.style.position = position
    place(bar, 0, bottom)
    document.body.append(bar)
  }

  it('takes the focus, and leaves the window where it is if the heading stands in it', () => {
    place(heading, 300, 340)

    focusStepHeading(heading)

    expect(document.activeElement).toBe(heading)
    expect(heading.scrollIntoView).not.toHaveBeenCalled()
  })

  it('comes into the window from above and from below', () => {
    place(heading, -20, 20)
    focusStepHeading(heading)
    expect(heading.scrollIntoView).toHaveBeenCalledTimes(1)

    place(heading, 780, 820)
    focusStepHeading(heading)
    expect(heading.scrollIntoView).toHaveBeenCalledTimes(2)
  })

  // Measured in the built wallet at 375 px: the heading stood 2 px under the navbar.
  it('counts what a navbar that stays covers, and stands below it', () => {
    navbar('fixed', 168)
    place(heading, 166, 206)

    focusStepHeading(heading)

    expect(heading.scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    expect(heading.style.scrollMarginTop).toBe('168px')
  })

  it('does not count a navbar that scrolls with the page', () => {
    navbar('static', 168)
    place(heading, 100, 140)

    focusStepHeading(heading)

    expect(heading.scrollIntoView).not.toHaveBeenCalled()
  })
})
