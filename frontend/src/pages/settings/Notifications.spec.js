// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createStore } from 'vuex'
import { BCol, BRow } from 'bootstrap-vue-next'
import Notifications from './Notifications.vue'

const mountNotifications = () => {
  const store = createStore({
    state: () => ({ newsletterState: false }),
    mutations: { newsletterState: (state, value) => (state.newsletterState = value) },
  })
  const wrapper = mount(Notifications, {
    global: {
      plugins: [store],
      stubs: { BRow, BCol, RouterLink: true, 'user-newsletter': true },
      mocks: { $t: (key) => key },
    },
  })
  return { wrapper, store }
}

describe('the notifications section', () => {
  /**
   * The switch beside this line writes to the store. Read once into a ref -- as the old
   * settings page did -- the sentence below the switch keeps saying the opposite of the
   * switch until the next reload.
   */
  it('follows the switch beside it', async () => {
    const { wrapper, store } = mountNotifications()
    expect(wrapper.text()).toContain('settings.newsletter.newsletterFalse')

    store.commit('newsletterState', true)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('settings.newsletter.newsletterTrue')
  })
})
