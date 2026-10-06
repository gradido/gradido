// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GradidoAddressCopy from './GradidoAddressCopy.vue'

vi.mock('@/config', () => ({
  default: { COMMUNITY_URL: 'https://ki-playground.gradido.net' },
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {} } })

const wrapperFor = (alias = 'bernd') =>
  mount(GradidoAddressCopy, {
    props: { alias },
    global: { plugins: [i18n] },
  })

describe('GradidoAddressCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the address without a scheme', () => {
    expect(wrapperFor().text()).toBe('ki-playground.gradido.net/u/bernd')
  })

  // Shown without a scheme, copied with one: without it many phone cameras and chat clients
  // do not offer to open the address at all.
  it('copies the address WITH the scheme', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await wrapperFor().find('button').trigger('click')

    expect(writeText).toHaveBeenCalledWith('https://ki-playground.gradido.net/u/bernd')
    expect(mockToastSuccess).toHaveBeenCalledWith('gradidoid-copied-to-clipboard')
    expect(mockToastError).not.toHaveBeenCalled()
  })

  // On the public profile page this control is the whole instruction -- copy the address,
  // paste it into your own account. Saying "copied" when nothing was copied would leave the
  // visitor pasting an empty clipboard and never knowing why.
  it('says nothing was copied when the write is refused', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await wrapperFor().find('button').trigger('click')
    await flushPromises()

    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledWith('gradidoid-not-copied')
  })

  // The other way to fail, and it is not a rejected promise: without TLS and in some of the
  // browsers built into other apps there is no clipboard at all, so the call throws on the
  // spot and a `.catch` on the promise would never run. A QR code on paper is opened by
  // whatever browser the phone happens to launch.
  it('survives a browser without a clipboard', async () => {
    vi.stubGlobal('navigator', {})

    await wrapperFor().find('button').trigger('click')
    await flushPromises()

    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledWith('gradidoid-not-copied')
  })

  // A button, not an anchor: an anchor without a target is in no tab order, so the address
  // would be out of reach for anybody working without a mouse.
  it('offers the control to the keyboard', () => {
    const wrapper = wrapperFor()

    expect(wrapper.find('button').attributes('type')).toBe('button')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  // Bernd's decision on the mockup: the icon sits behind the address, not in front of it.
  it('puts the copy icon behind the address', () => {
    const html = wrapperFor().html()

    expect(html.indexOf('ki-playground')).toBeLessThan(html.indexOf('ibicopy'))
  })

  /**
   * On a window of 320px and less the top bar has no room for the whole address. It breaks
   * before the namespace then: the community on one line, `/u/name` with the icon on the
   * next (Bernd, 06.10.2026).
   */
  describe('where the address does not fit on one line', () => {
    it('is two parts, the community and the rest, with nothing between them', () => {
      const wrapper = wrapperFor()
      const parts = wrapper.findAll('.address-part')

      expect(parts.map((part) => part.text())).toEqual(['ki-playground.gradido.net', '/u/bernd'])
      // Not a space, not a line end: read as it stands in the page, untrimmed.
      expect(wrapper.find('button').element.textContent.trim()).toBe(
        'ki-playground.gradido.net/u/bernd',
      )
    })

    // An icon outside the parts wraps alone under a long name.
    it('keeps the copy icon inside the last part', () => {
      const wrapper = wrapperFor()

      expect(wrapper.find('[data-test="gradido-address-path"]').html()).toContain('ibicopy')
      expect(wrapper.find('[data-test="gradido-address-host"]').html()).not.toContain('ibicopy')
    })

    // jsdom lays nothing out, so the stylesheet says it -- read without its comments.
    it('moves each part as a whole and breaks inside one only as the last resort, in the stylesheet', () => {
      const style = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'GradidoAddressCopy.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
      const rule = (selector) =>
        style.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

      expect(rule('\\.address-part')).toMatch(/display:\s*inline-block/)
      expect(rule('\\.address-part')).toMatch(/max-width:\s*100%/)
      expect(rule('\\.copy-clipboard-button')).toMatch(/overflow-wrap:\s*anywhere/)
      expect(rule('\\.copy-clipboard-button')).toMatch(/text-align:\s*inherit/)
    })
  })

  // The address is built from whatever it is handed, so an account from before the user name
  // became compulsory carries its Gradido ID here and stays reachable.
  it('takes a Gradido ID as readily as a user name', () => {
    expect(wrapperFor('8f3a1c7e-42b9-4d61-9c07-1e5a2b8d3f40').text()).toBe(
      'ki-playground.gradido.net/u/8f3a1c7e-42b9-4d61-9c07-1e5a2b8d3f40',
    )
  })
})
