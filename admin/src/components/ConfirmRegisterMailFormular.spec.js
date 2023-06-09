import { mount } from '@vue/test-utils'
import ConfirmRegisterMailFormular from './ConfirmRegisterMailFormular'

import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue()

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    mutate: apolloMutateMock,
  },
}

const propsData = {
  checked: false,
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

      it('calls the API with email', () => {
        expect(apolloMutateMock).toBeCalledWith(
          expect.objectContaining({
            variables: { email: 'bob@baumeister.de' },
          }),
        )
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('unregister_mail.success')
      })
    })

    describe('send register mail with error', () => {
      beforeEach(() => {
        apolloMutateMock.mockRejectedValue({ message: 'OUCH!' })
        wrapper = Wrapper()
        wrapper.find('button.test-button').trigger('click')
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('unregister_mail.error')
      })
    })
  })
})
