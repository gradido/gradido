import { mount } from '@vue/test-utils'
import ContributionMessagesList from './ContributionMessagesList'

const localVue = global.localVue

describe('ContributionMessagesList', () => {
  let wrapper

  const propsData = {
    contributionId: 42,
    status: 'IN_PROGRESS',
    messages: [],
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: 'en',
    },
  }

  const Wrapper = () => {
    return mount(ContributionMessagesList, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-messages-list', () => {
      expect(wrapper.find('div.contribution-messages-list').exists()).toBe(true)
    })

    it('has a Component ContributionMessagesFormular', () => {
      expect(wrapper.findComponent({ name: 'ContributionMessagesFormular' }).exists()).toBe(true)
    })

    describe('update Status', () => {
      beforeEach(() => {
        wrapper.vm.updateStatus()
      })

      it('emits getListContributionMessages', async () => {
        expect(wrapper.vm.$emit('update-status')).toBeTruthy()
      })
    })
  })
})
