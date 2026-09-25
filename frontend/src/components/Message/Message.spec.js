import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Message from './Message'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/login', component: { template: '<div>Login</div>' } }],
})

describe('Message', () => {
  const propsData = {
    headline: 'Headline text',
    subtitle: 'Subtitle text',
    buttonText: 'login',
    linkTo: '/login',
  }

  const mountComponent = (props = propsData) => {
    return mount(Message, {
      props,
      global: {
        plugins: [router],
        mocks: {
          $t: (key) => key,
        },
      },
    })
  }

  describe('mount', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mountComponent()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.header').exists()).toBe(true)
    })

    // Some subtitles run to four sentences: at half the card's width and in bold, the one after a
    // table-code registration stood on twelve lines on a phone (measured in the built wallet).
    it('gives the subtitle the whole width of the card, in regular weight', () => {
      const container = wrapper.find('.header-body').element.parentElement
      expect([...container.classList].filter((name) => /^w-\d+$/.test(name))).toEqual([])
      expect(wrapper.find('.test-message-subtitle').classes()).toContain('fw-normal')
    })

    describe('with button', () => {
      it('renders title, subtitle, and button text', () => {
        expect(wrapper.find('.test-message-headline').text()).toBe('Headline text')
        expect(wrapper.find('.test-message-subtitle').text()).toBe('Subtitle text')
        expect(wrapper.find('.test-message-button').text()).toBe('login')
      })

      it('button triggers navigation when clicked', async () => {
        const pushSpy = vi.spyOn(router, 'push')
        await wrapper.find('.test-message-button').trigger('click')
        expect(pushSpy).toHaveBeenCalledWith('/login')
      })
    })

    describe('without button', () => {
      beforeEach(() => {
        wrapper = mountComponent({
          ...propsData,
          buttonText: null,
          linkTo: null,
        })
      })

      it('renders title and subtitle', () => {
        expect(wrapper.find('.test-message-headline').text()).toBe('Headline text')
        expect(wrapper.find('.test-message-subtitle').text()).toBe('Subtitle text')
      })

      it('button is not shown', () => {
        expect(wrapper.find('.test-message-button').exists()).toBe(false)
      })
    })
  })
})
