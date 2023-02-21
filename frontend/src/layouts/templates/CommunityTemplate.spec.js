import { mount } from '@vue/test-utils'
import CommunityTemplate from './CommunityTemplate'

const localVue = global.localVue

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
  $route: {
    params: {
      tab: 'contribute',
    },
  },
}

describe('CommunityTemplate', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CommunityTemplate, { localVue, mocks })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.findComponent({ name: 'ContributionInfo' }).exists()).toBe(true)
    })

    describe('mounted with parameter contributions', () => {
      beforeEach(() => {
        mocks.$route.params.tab = 'contributions'
      })

      it('has a header related to "my contribitions"', () => {
        expect(wrapper.find('h4.alert-heading').text()).toBe('community.myContributions')
      })

      it('has a hint text', () => {
        expect(wrapper.find('p').text()).toBe('contribution.alert.myContributionNoteList')
      })

      it('has a legend to explain the icons', () => {
        const listItems = wrapper.findAll('li')

        expect(listItems.at(0).find('svg').attributes('aria-label')).toEqual('bell fill')
        expect(listItems.at(0).text()).toBe('contribution.alert.pending')

        expect(listItems.at(1).find('svg').attributes('aria-label')).toEqual('question square')
        expect(listItems.at(1).text()).toBe('contribution.alert.in_progress')

        expect(listItems.at(2).find('svg').attributes('aria-label')).toEqual('check')
        expect(listItems.at(2).text()).toBe('contribution.alert.confirm')

        expect(listItems.at(3).find('svg').attributes('aria-label')).toEqual('x circle')
        expect(listItems.at(3).text()).toBe('contribution.alert.denied')
      })
    })

    describe('mounted with parameter community', () => {
      beforeEach(() => {
        mocks.$route.params.tab = 'community'
      })

      it('has a header related to "the community"', () => {
        expect(wrapper.find('h4.alert-heading').text()).toBe('navigation.community')
      })

      it('has a hint text', () => {
        expect(wrapper.find('p').text()).toBe('contribution.alert.communityNoteList')
      })

      it('has a legend to explain the icons', () => {
        const listItems = wrapper.findAll('li')

        expect(listItems.at(0).find('svg').attributes('aria-label')).toEqual('bell fill')
        expect(listItems.at(0).text()).toBe('contribution.alert.pending')

        expect(listItems.at(1).find('svg').attributes('aria-label')).toEqual('question square')
        expect(listItems.at(1).text()).toBe('contribution.alert.in_progress')

        expect(listItems.at(2).find('svg').attributes('aria-label')).toEqual('check')
        expect(listItems.at(2).text()).toBe('contribution.alert.confirm')

        expect(listItems.at(3).find('svg').attributes('aria-label')).toEqual('x circle')
        expect(listItems.at(3).text()).toBe('contribution.alert.denied')
      })
    })

    describe('mounted with parameter contribute', () => {
      beforeEach(() => {
        mocks.$route.params.tab = 'contribute'
      })

      it('has a header related to "the community"', () => {
        expect(wrapper.find('h3').text()).toBe('contribution.formText.yourContribution')
      })

      it('has a hint text', () => {
        expect(wrapper.find('div.my-3').text()).toBe('contribution.formText.describeYourCommunity')
      })
    })
  })
})
