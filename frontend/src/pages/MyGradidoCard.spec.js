// AI-GENERATED — not an architecture reference

import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MyGradidoCard from './MyGradidoCard.vue'
import { renderQrCodeCanvas } from '@/utils/qrCode'

/**
 * The real `OwnCodeView` is mounted underneath, on purpose. What has to be right is the
 * LINK -- and only a test that follows it all the way to the generator can say that the
 * page hands over the address it shows.
 */
vi.mock('@/utils/qrCode', () => ({ renderQrCodeCanvas: vi.fn() }))

vi.mock('@/config', () => ({
  default: { COMMUNITY_URL: 'https://ki-playground.gradido.net' },
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      pageTitle: { 'my-gradido-card': 'My Gradido card' },
      'my-codes': { back: 'Back', 'gradido-card': { hint: 'Whoever scans this can send.' } },
      'copy-to-clipboard': 'Copy',
    },
  },
})

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/overview', component: { template: '<div />' } }],
})

const mountPage = (state) =>
  mount(MyGradidoCard, {
    global: {
      plugins: [i18n, router, createStore({ state: () => state })],
    },
  })

describe('MyGradidoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderQrCodeCanvas.mockImplementation((link) =>
      Promise.resolve({ toDataURL: () => `drawn:${link}` }),
    )
  })

  it('draws the member address, with the scheme a camera needs', async () => {
    mountPage({ username: 'BerndH', gradidoID: 'uuid-1' })
    await flushPromises()

    expect(renderQrCodeCanvas).toHaveBeenCalledWith('https://ki-playground.gradido.net/u/BerndH')
  })

  it('shows the address as text too, without the scheme', async () => {
    const wrapper = mountPage({ username: 'BerndH', gradidoID: 'uuid-1' })
    await flushPromises()

    expect(wrapper.find('[data-test="my-gradido-card-address"]').text()).toContain(
      'ki-playground.gradido.net/u/BerndH',
    )
  })

  /**
   * ⛔ The difference from the PRINTED card, and it is deliberate: that one refuses to be
   * made without a user name, because paper is given away and cannot be corrected. A screen
   * can be corrected, and the Gradido ID resolves exactly as well -- so this page shows the
   * address it has rather than sending somebody away.
   */
  it('falls back to the Gradido ID when there is no user name', async () => {
    mountPage({ username: '', gradidoID: 'uuid-1' })
    await flushPromises()

    expect(renderQrCodeCanvas).toHaveBeenCalledWith('https://ki-playground.gradido.net/u/uuid-1')
  })

  /**
   * The instant before the login answer has landed. An address built then would read
   * `host/u/` -- an address with nobody in it, and a code leading to it.
   */
  it('draws nothing at all while neither name nor id is known', async () => {
    const wrapper = mountPage({ username: '', gradidoID: null })
    await flushPromises()

    expect(renderQrCodeCanvas).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="own-code-picture"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="my-gradido-card-address"]').exists()).toBe(false)
  })
})
