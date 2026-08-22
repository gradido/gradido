import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import NotFoundPage from './NotFoundPage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { BContainer } from 'bootstrap-vue-next'

describe('NotFoundPage', () => {
  let wrapper
  let router
  let i18n

  beforeEach(() => {
    // Real routes, or push() matches nothing and history.state.back never fills -- and the
    // "came from" case would pass for the wrong reason.
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/overview', component: { template: '<div />' } },
        { path: '/somewhere', component: { template: '<div />' } },
      ],
    })

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          back: 'Back',
        },
      },
    })

    wrapper = mount(NotFoundPage, {
      global: {
        plugins: [router, i18n],
        stubs: {
          BContainer,
          BButton: true,
        },
      },
    })
  })

  describe('render', () => {
    it('has a svg', () => {
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('has a back button', () => {
      expect(wrapper.find('.test-back').exists()).toBe(true)
    })
  })

  describe('interactions', () => {
    // ⚠️ Twice on purpose. The FIRST push replaces the initial entry instead of stacking on
    // it (`replaced: true`, `back: null`), so after one navigation there is still nothing to
    // go back to -- and this test would fail while the code is right.
    it('goes back where it came from', async () => {
      await router.push('/somewhere')
      await router.isReady()
      await router.push('/overview')
      const back = vi.spyOn(router, 'back').mockImplementation(() => {})

      await wrapper.find('.test-back').trigger('click')

      expect(back).toHaveBeenCalled()
    })

    // This page is reached by typing an address or opening a stale link, so there is often
    // nothing behind it -- a bare history step would be a button that does nothing. Installed
    // on a home screen there is no browser bar to fall back on either.
    it('goes to the overview when there is nothing to go back to', async () => {
      const push = vi.spyOn(router, 'push')
      vi.spyOn(router.options.history, 'state', 'get').mockReturnValue({ back: null })

      await wrapper.find('.test-back').trigger('click')

      expect(push).toHaveBeenCalledWith('/overview')
    })

    // Without .prevent the anchor's own href runs after the handler, so the router push is
    // followed by a jump to "#!" -- an extra history entry, and "#!" left in the address.
    // (The flaw is older than this page's back path: master had it on $router.go(-1).)
    it('does not let the anchor href fire on top of the navigation', async () => {
      vi.spyOn(router, 'push').mockImplementation(() => Promise.resolve())
      const anchor = wrapper.find('a[href="#!"]').element
      const click = new window.MouseEvent('click', { bubbles: true, cancelable: true })

      anchor.dispatchEvent(click)

      expect(click.defaultPrevented).toBe(true)
    })

    // The whole illustration above the button is the same way out, and it was the one that
    // still carried the bare history step.
    it('takes the same way out when the illustration is clicked', async () => {
      const push = vi.spyOn(router, 'push')
      vi.spyOn(router.options.history, 'state', 'get').mockReturnValue({ back: null })

      await wrapper.find('a[href="#!"]').trigger('click')

      expect(push).toHaveBeenCalledWith('/overview')
    })
  })
})
