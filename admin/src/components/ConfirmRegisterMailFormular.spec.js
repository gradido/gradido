import { mount } from '@vue/test-utils'
import ConfirmRegisterMailFormular from './ConfirmRegisterMailFormular.vue'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue()

const mocks = {
  $moment: jest.fn(() => {
    return {
      format: jest.fn((m) => m),
      subtract: jest.fn(() => {
        return {
          format: jest.fn((m) => m),
        }
      }),
    }
  }),
  $apollo: {
    mutate: apolloMutateMock,
  },
}

const propsData = {
  email: 'bob@baumeister.de',
  dateLastSend: '',
}

describe('ConfirmRegisterMailFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ConfirmRegisterMailFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-confirm-register-mail', () => {
      expect(wrapper.find('.component-confirm-register-mail').exists()).toBeTruthy()
    })

    describe('send register mail with success', () => {
      beforeEach(() => {
        wrapper.find('button.test-button').trigger('click')
      })

      it('calls the API', () => {
        expect(apolloMutateMock).toBeCalled()
      })
    })

    describe('send register mail with error', () => {
      beforeEach(() => {
        apolloMutateMock.mockRejectedValue({ message: 'OUCH!' })
        wrapper = Wrapper()
        wrapper.find('button.test-button').trigger('click')
      })

      it('calls the API', () => {
        expect(apolloMutateMock).toBeCalled()
      })
    })
  })
})
