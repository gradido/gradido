import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContributionsTemplate from './ContributionsTemplate'
import ContributionInfo from '@/components/Template/RightSide/ContributionInfo.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key, // Mock translation function
  }),
}))

describe('ContributionsTemplate', () => {
  let wrapper

  const createWrapper = (tab) => {
    return mount(ContributionsTemplate, {
      global: {
        components: {
          ContributionInfo,
        },
        mocks: {
          $t: (msg) => msg,
          $route: {
            params: { tab },
          },
        },
        stubs: {
          'variant-icon': true,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper('contribute')
    })

    it('renders the component', () => {
      expect(wrapper.findComponent({ name: 'ContributionInfo' }).exists()).toBe(true)
    })

    describe('mounted with parameter own-contributions', () => {
      beforeEach(() => {
        wrapper = createWrapper('own-contributions')
      })

      it('has a header related to "my contributions"', () => {
        expect(wrapper.find('h4.alert-heading').text()).toBe('community.myContributions')
      })

      it('has a hint text', () => {
        expect(wrapper.find('p').text()).toBe('contribution.alert.myContributionNoteList')
      })

      it('has a legend to explain the icons', () => {
        const listItems = wrapper.findAll('li')

        expect(listItems[0].find('variant-icon-stub').attributes('icon')).toBe('bell-fill')
        expect(listItems[0].text()).toContain('contribution.alert.pending')

        expect(listItems[1].find('variant-icon-stub').attributes('icon')).toBe('question')
        expect(listItems[1].text()).toContain('contribution.alert.in_progress')

        expect(listItems[2].find('variant-icon-stub').attributes('icon')).toBe('check')
        expect(listItems[2].text()).toContain('contribution.alert.confirm')

        expect(listItems[3].find('variant-icon-stub').attributes('icon')).toBe('x-circle')
        expect(listItems[3].text()).toContain('contribution.alert.denied')

        expect(listItems[4].find('variant-icon-stub').attributes('icon')).toBe('trash')
        expect(listItems[4].text()).toContain('contribution.alert.deleted')
      })
    })

    describe('mounted with parameter all-contributions', () => {
      beforeEach(() => {
        wrapper = createWrapper('all-contributions')
      })

      it('has a header related to "the community"', () => {
        expect(wrapper.find('h4.alert-heading').text()).toBe('navigation.community')
      })

      it('has a hint text', () => {
        expect(wrapper.find('p').text()).toBe('contribution.alert.communityNoteList')
      })

      it('has a legend to explain the icons', () => {
        const listItems = wrapper.findAll('li')

        expect(listItems[0].find('variant-icon-stub').attributes('icon')).toBe('bell-fill')
        expect(listItems[0].text()).toContain('contribution.alert.pending')

        expect(listItems[1].find('variant-icon-stub').attributes('icon')).toBe('question')
        expect(listItems[1].text()).toContain('contribution.alert.in_progress')

        expect(listItems[2].find('variant-icon-stub').attributes('icon')).toBe('check')
        expect(listItems[2].text()).toContain('contribution.alert.confirm')

        expect(listItems[3].find('variant-icon-stub').attributes('icon')).toBe('x-circle')
        expect(listItems[3].text()).toContain('contribution.alert.denied')

        expect(listItems).toHaveLength(4) // 'trash' icon should not be present
      })
    })

    describe('mounted with parameter contribute', () => {
      beforeEach(() => {
        wrapper = createWrapper('contribute')
      })

      it('has a header related to "your contribution"', () => {
        expect(wrapper.find('h3').text()).toBe('contribution.formText.yourContribution')
      })

      it('has a hint text', () => {
        expect(wrapper.find('div.my-3').text()).toBe('contribution.formText.describeYourCommunity')
      })
    })
  })
})
