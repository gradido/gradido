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
    router = createRouter({
      history: createWebHistory(),
      routes: [],
    })

    router.go = vi.fn()

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
    it('calls router.go(-1) when back button is clicked', async () => {
      await wrapper.find('.test-back').trigger('click')
      expect(router.go).toHaveBeenCalledWith(-1)
    })
  })
})
