import { mount } from '@vue/test-utils'
import ContributionMessagesFormular from './ContributionMessagesFormular.vue'
import { toastErrorSpy, toastSuccessSpy } from '../../../test/testSetup'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue()

describe('ContributionMessagesFormular', () => {
  let wrapper

  const propsData = {
    contributionId: 42,
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $apollo: {
      mutate: apolloMutateMock,
    },
    $i18n: {
      locale: 'en',
    },
  }

  const Wrapper = () => {
    return mount(ContributionMessagesFormular, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-messages-formular', () => {
      expect(wrapper.find('div.contribution-messages-formular').exists()).toBe(true)
    })

    describe('call onReset', () => {
      beforeEach(async () => {
        wrapper.setData({
          form: {
            text: 'text form message',
          },
        })
        await wrapper.find('form').trigger('reset')
      })

      it('form has the set data', () => {
        expect(wrapper.vm.form).toEqual({
          text: '',
        })
      })
    })

    describe('call onSubmit', () => {
      it('response with the contribution message', async () => {
        await wrapper.find('form').trigger('submit')
      })
    })

    describe('send contribution message with error', () => {
      beforeEach(async () => {
        apolloMutateMock.mockRejectedValue({ message: 'OUCH!' })
        wrapper = Wrapper()
        await wrapper.find('form').trigger('submit')
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('OUCH!')
      })
    })

    describe('send contribution message with success', () => {
      beforeEach(async () => {
        wrapper.setData({
          form: {
            text: 'text form message',
          },
        })
        wrapper = Wrapper()
        await wrapper.find('form').trigger('submit')
      })

      it('toasts an success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('message.request')
      })
    })
  })
})
