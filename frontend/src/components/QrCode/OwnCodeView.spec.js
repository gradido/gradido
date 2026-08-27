// AI-GENERATED — not an architecture reference

import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OwnCodeView from './OwnCodeView.vue'
import { renderQrCodeCanvas } from '@/utils/qrCode'

vi.mock('@/utils/qrCode', () => ({ renderQrCodeCanvas: vi.fn() }))

const canvasFor = (link) => ({ toDataURL: () => `drawn:${link}` })

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en: { 'my-codes': { back: 'Back' } } },
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/overview', component: { template: '<div />' } },
    { path: '/somewhere', component: { template: '<div />' } },
  ],
})

const mountView = (props = {}) =>
  mount(OwnCodeView, {
    props: { title: 'My card', ...props },
    global: { plugins: [i18n, router] },
  })

describe('OwnCodeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderQrCodeCanvas.mockImplementation((link) => Promise.resolve(canvasFor(link)))
  })

  it('draws the code it is given', async () => {
    const wrapper = mountView({ link: 'https://example.test/dk/DK-1' })
    await flushPromises()

    expect(renderQrCodeCanvas).toHaveBeenCalledWith('https://example.test/dk/DK-1')
    expect(wrapper.find('[data-test="own-code-picture"]').attributes('src')).toBe(
      'drawn:https://example.test/dk/DK-1',
    )
  })

  /**
   * The empty link is a real state, not an oversight: the thank-you card has none until its
   * card is known, and none at all while the card function is off. Drawing an empty string
   * would put a code on the screen that leads nowhere.
   */
  it('draws nothing without a link, and does not ask the generator', async () => {
    const wrapper = mountView({ link: '' })
    await flushPromises()

    expect(renderQrCodeCanvas).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="own-code-picture"]').exists()).toBe(false)
  })

  it('draws once the link arrives late', async () => {
    const wrapper = mountView({ link: '' })
    await flushPromises()

    await wrapper.setProps({ link: 'https://example.test/dk/DK-2' })
    await flushPromises()

    expect(wrapper.find('[data-test="own-code-picture"]').attributes('src')).toBe(
      'drawn:https://example.test/dk/DK-2',
    )
  })

  /**
   * ⚠️ The reason the round counter exists. Two draws can be in flight at once, and the one
   * that finishes LAST is not necessarily the current one -- an older drawing landing second
   * would leave a code on the screen that no longer belongs to this page.
   *
   * Here the first draw is deliberately resolved after the second.
   */
  it('keeps the newest code when an older drawing finishes last', async () => {
    const pending = []
    renderQrCodeCanvas.mockImplementation(
      (link) => new Promise((resolve) => pending.push(() => resolve(canvasFor(link)))),
    )

    const wrapper = mountView({ link: 'first' })
    await wrapper.setProps({ link: 'second' })

    expect(pending).toHaveLength(2)
    pending[1]()
    await flushPromises()
    pending[0]()
    await flushPromises()

    expect(wrapper.find('[data-test="own-code-picture"]').attributes('src')).toBe('drawn:second')
  })

  /**
   * The coin in the middle comes from our own server, so this only happens when the wallet's
   * own assets are unreachable. It must not take the page down with it: the way out has to
   * stay, or somebody is stuck on a bare screen with no chrome around it.
   */
  it('survives a drawing that fails, and keeps the way out', async () => {
    renderQrCodeCanvas.mockRejectedValue(new Error('no coin'))

    const wrapper = mountView({ link: 'https://example.test/dk/DK-3' })
    await flushPromises()

    expect(wrapper.find('[data-test="own-code-picture"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="own-code-back"]').exists()).toBe(true)
  })

  it('goes back where it came from', async () => {
    await router.push('/somewhere')
    await router.isReady()
    const back = vi.spyOn(router, 'back').mockImplementation(() => {})
    const wrapper = mountView({ link: '' })

    await wrapper.find('[data-test="own-code-back"]').trigger('click')

    expect(back).toHaveBeenCalled()
  })

  // Opened from a bookmark or a typed address there is no "came from", and `router.back()`
  // would leave the browser on whatever stood there before the wallet.
  it('goes to the overview when there is nothing to go back to', async () => {
    const wrapper = mountView({ link: '' })
    const push = vi.spyOn(router, 'push')
    vi.spyOn(router.options.history, 'state', 'get').mockReturnValue({ back: null })

    await wrapper.find('[data-test="own-code-back"]').trigger('click')

    expect(push).toHaveBeenCalledWith('/overview')
  })
})
