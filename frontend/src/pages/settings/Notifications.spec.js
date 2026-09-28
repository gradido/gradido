// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createStore } from 'vuex'
import { BCol, BRow } from 'bootstrap-vue-next'
import Notifications from './Notifications.vue'

const mountNotifications = (transfersInChat = null) => {
  const store = createStore({
    state: () => ({ newsletterState: false, transfersInChat }),
    mutations: {
      newsletterState: (state, value) => (state.newsletterState = value),
      transfersInChat: (state, value) => (state.transfersInChat = value),
    },
  })
  const wrapper = mount(Notifications, {
    global: {
      plugins: [store],
      stubs: {
        BRow,
        BCol,
        RouterLink: true,
        'user-newsletter': true,
        // The switch saves through the server; its own spec holds that.
        UserSettingsSwitch: {
          name: 'UserSettingsSwitch',
          props: ['initialValue', 'attrName', 'enabledText', 'disabledText', 'label'],
          template: '<div data-test="switch" />',
        },
      },
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

  /**
   * The transfers in the conversations and the mail about one received, one switch (Bernd,
   * 28.09.2026), on by default: "not known" (a store from before the field) reads as on.
   */
  describe('the switch for the transfers in the conversations', () => {
    const row = (wrapper) => wrapper.find('[data-test="settings-transfers-in-chat"]')
    const state = (wrapper) => wrapper.find('[data-test="settings-transfers-in-chat-state"]')
    const theSwitch = (wrapper) => row(wrapper).findComponent({ name: 'UserSettingsSwitch' })

    it('stands under the newsletter, with its words and a switch that saves the setting', () => {
      const { wrapper } = mountNotifications()
      expect(row(wrapper).text()).toContain('settings.transfersInChat.title')
      expect(wrapper.text().indexOf('settings.newsletter.newsletter')).toBeLessThan(
        wrapper.text().indexOf('settings.transfersInChat.title'),
      )
      expect(theSwitch(wrapper).props()).toEqual({
        initialValue: true,
        attrName: 'transfersInChat',
        enabledText: 'settings.transfersInChat.on',
        disabledText: 'settings.transfersInChat.off',
        label: 'settings.transfersInChat.title',
      })
    })

    it('reads as on while not known, and as off only where the member switched it off', async () => {
      const { wrapper, store } = mountNotifications(null)
      expect(state(wrapper).text()).toBe('settings.transfersInChat.on')

      store.commit('transfersInChat', false)
      await wrapper.vm.$nextTick()
      expect(state(wrapper).text()).toBe('settings.transfersInChat.off')
      expect(theSwitch(wrapper).props('initialValue')).toBe(false)

      store.commit('transfersInChat', true)
      await wrapper.vm.$nextTick()
      expect(state(wrapper).text()).toBe('settings.transfersInChat.on')
    })
  })
})
