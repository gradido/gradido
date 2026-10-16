// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BButton } from 'bootstrap-vue-next'
import i18n from '@/i18n'
import AvatarCropper from './AvatarCropper.vue'

/**
 * Ctrl+V in the avatar's window (Bernd, 16.10.2026): a pasted picture is taken as a dropped one.
 * The window is the wallet's own (AppModal), put at <body>; it does not take the keyboard, which
 * stays on the page behind it. jsdom decodes no picture: the test stops where the file is read.
 */
describe('AvatarCropper, a picture pasted (Ctrl+V)', () => {
  let wrapper
  let read

  const mountCropper = (props = {}) => {
    wrapper = mount(AvatarCropper, {
      props: { modelValue: true, hasAvatar: false, ...props },
      global: {
        plugins: [i18n],
        components: { BButton },
        stubs: {
          IBiImage: true,
          IBiArrowClockwise: true,
          IBiSymmetryVertical: true,
          IBiX: true,
        },
      },
      attachTo: document.body,
    })
    return wrapper
  }

  const png = () => new File(['PNG'], 'image.png', { type: 'image/png' })

  /** What the clipboard holds, pasted on `target` -- the page, where the keyboard stays. */
  const paste = ({ text = '', files = [png()] } = {}, target = document.body) => {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: (type) => (type === 'text/plain' ? text : ''), files, items: [] },
    })
    target.dispatchEvent(event)
    return event
  }

  beforeEach(() => {
    i18n.global.locale.value = 'de'
    read = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => {})
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('reads a picture pasted while the window is open, wherever the keyboard stands', () => {
    mountCropper()
    const file = png()

    const event = paste({ files: [file] })

    expect(read).toHaveBeenCalledTimes(1)
    expect(read).toHaveBeenCalledWith(file)
    expect(event.defaultPrevented).toBe(true)
  })

  it('leaves a paste with words alone', () => {
    mountCropper()

    const event = paste({ text: 'Lena' })

    expect(read).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('reads nothing while the window is closed', () => {
    mountCropper({ modelValue: false })

    paste()

    expect(read).not.toHaveBeenCalled()
  })

  it('reads nothing while it asks whether to remove the picture', async () => {
    mountCropper({ hasAvatar: true })
    document.body.querySelector('.btn-outline-danger').click()
    await flushPromises()
    expect(document.body.querySelector('.avatar-remove-question')).not.toBeNull()

    paste()

    expect(read).not.toHaveBeenCalled()
  })

  // The same way in as a picture dropped or chosen: a file too large is turned away before it is read.
  it('says of a pasted picture too large what it says of a chosen one', async () => {
    mountCropper()
    const huge = png()
    Object.defineProperty(huge, 'size', { value: 25 * 1024 * 1024 })

    paste({ files: [huge] })
    await flushPromises()

    expect(read).not.toHaveBeenCalled()
    expect(document.body.querySelector('.avatar-error').textContent).toBe(
      i18n.global.t('avatar.error-too-large', { limit: 20 }),
    )
  })
})
