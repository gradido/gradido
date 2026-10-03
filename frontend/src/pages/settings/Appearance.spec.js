// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'vuex'
import { BCol, BRow } from 'bootstrap-vue-next'
import Appearance from './Appearance.vue'
import SettingsSection from '@/components/UserSettings/SettingsSection.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
// The menu itself saves through the server; its own spec holds that.
vi.mock('@/components/LanguageSwitch2.vue', () => ({
  default: { name: 'LanguageSwitch2', template: '<div data-test="language-switch" />' },
}))

const mountAppearance = () =>
  mount(Appearance, {
    global: {
      plugins: [createStore({ state: () => ({ themeMode: 'system' }) })],
      // The real section: the class under test has to arrive on ITS card.
      components: { SettingsSection },
      stubs: {
        BRow,
        BCol,
        BFormRadioGroup: true,
        RouterLink: true,
      },
      mocks: { $t: (key) => key },
    },
  })

describe('the appearance section', () => {
  /**
   * The settings card clips what reaches past it (`.gradido-border-radius` sets
   * `overflow: hidden`). The language menu opens downwards and is taller than what is left
   * of this short card, so its last languages lay below the edge, out of reach.
   */
  it('does not clip the language menu that opens out of its card', () => {
    const wrapper = mountAppearance()
    const card = wrapper.find('.card')

    expect(card.find('[data-test="language-switch"]').exists()).toBe(true)
    // The control: this is the card that clips by default.
    expect(card.classes()).toContain('gradido-border-radius')
    expect(card.classes()).toContain('overflow-visible')
  })
})
