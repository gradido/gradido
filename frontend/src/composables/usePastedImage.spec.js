// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePastedImage } from './usePastedImage'

/** A paste on `target` carrying what a test says is on the clipboard. */
const paste = ({ text = '', files = [] } = {}, target = document.body) => {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: (type) => (type === 'text/plain' ? text : ''), files, items: [] },
  })
  target.dispatchEvent(event)
  return event
}

const png = () => new File(['PNG'], 'image.png', { type: 'image/png' })

describe('usePastedImage', () => {
  let wrapper

  /** A component that takes pasted pictures where `belongs` says so. */
  const mountTaker = (take, belongs = () => true) => {
    wrapper = mount({
      setup() {
        usePastedImage(take, belongs)
        return () => null
      },
    })
    return wrapper
  }

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('hands a pasted picture on, and the paste does nothing else', () => {
    const take = vi.fn()
    mountTaker(take)
    const shot = png()

    const event = paste({ files: [shot] })

    expect(take).toHaveBeenCalledTimes(1)
    expect(take).toHaveBeenCalledWith(shot)
    expect(event.defaultPrevented).toBe(true)
  })

  it('hears a paste anywhere in the document: where the keyboard stands is often not here', () => {
    const take = vi.fn()
    mountTaker(take)
    const elsewhere = document.body.appendChild(document.createElement('textarea'))

    paste({ files: [png()] }, elsewhere)

    expect(take).toHaveBeenCalledTimes(1)
    elsewhere.remove()
  })

  it('leaves a paste with words alone, for the field it goes to', () => {
    const take = vi.fn()
    mountTaker(take)

    const event = paste({ text: 'Hallo', files: [png()] })

    expect(take).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('leaves a paste alone that is not this component’s, and asks with the paste', () => {
    const take = vi.fn()
    const belongs = vi.fn(() => false)
    mountTaker(take, belongs)

    const event = paste({ files: [png()] })

    expect(belongs).toHaveBeenCalledWith(event)
    expect(take).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('leaves a paste alone that another one has taken', () => {
    const first = vi.fn()
    const second = vi.fn()
    mountTaker(first)
    const firstWrapper = wrapper
    mountTaker(second)

    paste({ files: [png()] })

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
    firstWrapper.unmount()
  })

  it('hears nothing once the component is gone', () => {
    const take = vi.fn()
    mountTaker(take)
    wrapper.unmount()
    wrapper = null

    paste({ files: [png()] })

    expect(take).not.toHaveBeenCalled()
  })
})
