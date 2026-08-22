// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SettingsSection from './SettingsSection.vue'

const RouterLinkStub = { props: ['to'], template: '<a :to="to"><slot /></a>' }

const mountSection = () =>
  mount(SettingsSection, {
    props: { title: 'Mein Konto' },
    slots: { default: '<p data-test="content">the section</p>' },
    global: {
      stubs: { RouterLink: RouterLinkStub },
      mocks: { $t: (key) => key },
    },
  })

describe('SettingsSection', () => {
  it('names the section and carries its content', () => {
    const wrapper = mountSection()

    expect(wrapper.find('.h2').text()).toBe('Mein Konto')
    expect(wrapper.find('[data-test="content"]').exists()).toBe(true)
  })

  /**
   * The way back on a phone leads to the LIST, not to the account -- there are two of them,
   * and they are not the same. Above 992px the settings menu stands in the layout column and
   * carries the way back to the account, so this one steps aside: `d-lg-none`.
   */
  it('leads back to the list, and only on a narrow screen', () => {
    const wrapper = mountSection()
    const back = wrapper.find('[data-test="back-to-settings"]')

    expect(back.attributes('to')).toBe('/settings')
    expect(back.classes()).toContain('d-lg-none')
  })
})
