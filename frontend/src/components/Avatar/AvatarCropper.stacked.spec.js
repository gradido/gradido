// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BButton } from 'bootstrap-vue-next'
import i18n from '@/i18n'
import AvatarCropper from './AvatarCropper.vue'

/**
 * The cropper over the contact window (`stacked`, AS-023): a BModal of its own -- the contact
 * window's focus trap would pull the focus out of anything outside it -- with the caller's words,
 * the caller's pictures above the frame, and a paste that is its own only from inside it.
 *
 * BModal as far as the cropper uses it: shown while its model is true, an open Bootstrap window
 * (`.modal.show`) at the layer Bootstrap gives the second of two.
 */
const BModalStub = {
  name: 'BModal',
  props: { modelValue: Boolean, title: { type: String, default: '' } },
  emits: ['update:modelValue'],
  template: `<div class="modal show" style="z-index: 1056" :data-title="title" v-bind="$attrs">
    <template v-if="modelValue"><slot /><slot name="footer" /></template>
  </div>`,
  inheritAttrs: false,
}

describe('AvatarCropper over the contact window', () => {
  const wrappers = []
  let read

  const mountCropper = (props = {}, slots = {}) => {
    const wrapper = mount(AvatarCropper, {
      props: { modelValue: true, hasAvatar: false, stacked: true, ...props },
      slots,
      global: {
        plugins: [i18n],
        components: { BButton },
        stubs: {
          BModal: BModalStub,
          IBiImage: true,
          IBiArrowClockwise: true,
          IBiSymmetryVertical: true,
          IBiX: true,
        },
      },
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    return wrapper
  }

  const png = () => new File(['PNG'], 'image.png', { type: 'image/png' })
  const paste = (target) => {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: () => '', files: [png()], items: [] },
    })
    target.dispatchEvent(event)
    return event
  }

  beforeEach(() => {
    i18n.global.locale.value = 'de'
    read = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => {})
  })

  afterEach(() => {
    while (wrappers.length) wrappers.pop().unmount()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('opens as a window of its own, with the title and the line it is given', () => {
    mountCropper({ title: 'Dein Bild von Anna', note: 'Nur Du siehst es.' })

    const modal = document.body.querySelector('[data-test="avatar-cropper-stacked"]')
    expect(modal).not.toBeNull()
    expect(modal.getAttribute('data-title')).toBe('Dein Bild von Anna')
    expect(modal.getAttribute('aria-modal')).toBe('true')
    expect(document.body.querySelector('[data-test="avatar-cropper-note"]').textContent).toBe(
      'Nur Du siehst es.',
    )
    expect(document.body.querySelector('.modal-overlay')).toBeNull()
  })

  it('keeps its own title and no line where it is given none', () => {
    mountCropper({ stacked: false })

    expect(document.body.querySelector('[data-test="avatar-cropper-stacked"]')).toBeNull()
    expect(document.body.querySelector('[data-test="avatar-cropper-note"]')).toBeNull()
  })

  it("shows the caller's pictures while no new one is chosen", () => {
    mountCropper({}, { pictures: '<p class="the-pictures">both</p>' })

    expect(document.body.querySelector('.the-pictures')).not.toBeNull()
  })

  it("names the remove button and asks the caller's question", async () => {
    mountCropper({
      hasAvatar: true,
      removeLabel: 'Mein Bild entfernen',
      removeQuestion: 'Dann siehst Du wieder das Bild, das Anna gewählt hat.',
    })
    const remove = document.body.querySelector('.btn-outline-danger')
    expect(remove.textContent.trim()).toBe('Mein Bild entfernen')

    remove.click()
    await flushPromises()

    expect(document.body.querySelector('.avatar-remove-question').textContent.trim()).toBe(
      'Dann siehst Du wieder das Bild, das Anna gewählt hat.',
    )
  })

  // Two croppers can stand in the page (the navbar's own picture, a contact's): a label finds the
  // first field of its id, so each needs ids of its own.
  it('gives each window its own file fields', () => {
    // One app, as in the wallet: `useId` counts per app.
    const page = mount(
      {
        components: { AvatarCropper },
        template: '<div><AvatarCropper model-value stacked /><AvatarCropper model-value /></div>',
      },
      {
        global: {
          plugins: [i18n],
          components: { BButton },
          stubs: {
            BModal: BModalStub,
            IBiImage: true,
            IBiArrowClockwise: true,
            IBiSymmetryVertical: true,
            IBiX: true,
          },
        },
        attachTo: document.body,
      },
    )
    wrappers.push(page)

    const labels = [...document.body.querySelectorAll('label.btn[for]')]
    const ids = labels.map((label) => label.getAttribute('for'))
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(document.getElementById(id)?.type).toBe('file')
    }
  })

  describe('a picture pasted', () => {
    it('is read where the keyboard stands in this window', () => {
      mountCropper()
      const inside = document.body.querySelector('[data-test="avatar-cropper-stacked"] label.btn')

      const event = paste(inside)

      expect(read).toHaveBeenCalledTimes(1)
      expect(event.defaultPrevented).toBe(true)
    })

    // The contact window under it has a compose bar that takes pictures too: a paste there is
    // not this window's.
    it('is left alone where the keyboard stands outside it', () => {
      mountCropper()

      paste(document.body)

      expect(read).not.toHaveBeenCalled()
    })

    it('is left alone while another window lies over it', () => {
      mountCropper()
      const cover = document.createElement('div')
      cover.setAttribute('aria-modal', 'true')
      cover.style.zIndex = '2000'
      document.body.appendChild(cover)
      const inside = document.body.querySelector('[data-test="avatar-cropper-stacked"] label.btn')

      paste(inside)

      expect(read).not.toHaveBeenCalled()
    })
  })
})
