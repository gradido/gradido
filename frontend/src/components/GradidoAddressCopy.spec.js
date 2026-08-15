// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GradidoAddressCopy from './GradidoAddressCopy.vue'

vi.mock('@/config', () => ({
  default: { COMMUNITY_URL: 'https://ki-playground.gradido.net' },
}))

const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess }),
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

  // The address is built from whatever it is handed, so an account from before the user name
  // became compulsory carries its Gradido ID here and stays reachable.
  it('takes a Gradido ID as readily as a user name', () => {
    expect(wrapperFor('8f3a1c7e-42b9-4d61-9c07-1e5a2b8d3f40').text()).toBe(
      'ki-playground.gradido.net/u/8f3a1c7e-42b9-4d61-9c07-1e5a2b8d3f40',
    )
  })
})
