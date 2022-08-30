import { mount } from '@vue/test-utils'
import ContributionMessagesList from './ContributionMessagesList.vue'
import { toastErrorSpy, toastSuccessSpy } from '../../../test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue()

describe('ContributionMessagesList', () => {
  let wrapper

  const propsData = {
    contributionId: 42,
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: 'en',
    },
    $apollo: {
      query: apolloQueryMock,
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

    it('sends query to Apollo when created', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          variables: {
            contributionId: propsData.contributionId,
          },
        }),
      )
    })

    it('has a DIV .contribution-messages-list', () => {
      expect(wrapper.find('div.contribution-messages-list').exists()).toBe(true)
    })

    it('has a Component ContributionMessagesFormular', () => {
      expect(wrapper.findComponent({ name: 'ContributionMessagesFormular' }).exists()).toBe(true)
    })
  })
})
