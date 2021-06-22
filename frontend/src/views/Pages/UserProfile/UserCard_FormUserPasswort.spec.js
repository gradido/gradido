import { mount } from '@vue/test-utils'
import UserCardFormPasswort from './UserCard_FormUserPasswort'
import loginAPI from '../../../apis/loginAPI'
// import flushPromises from 'flush-promises'

jest.mock('../../../apis/loginAPI')

const localVue = global.localVue

const changePasswordProfileMock = jest.fn()
loginAPI.changePasswordProfile = changePasswordProfileMock

const toastSuccessMock = jest.fn()
const toastErrorMock = jest.fn()

describe('UserCardFormUserPasswort', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        sessionId: 1,
        email: 'user@example.org',
      },
    },
    $toast: {
      success: toastSuccessMock,
      error: toastErrorMock,
    },
  }

  const Wrapper = () => {
    return mount(UserCardFormPasswort, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#change_pwd').exists()).toBeTruthy()
    })

    it('has a change password button', () => {
      expect(wrapper.find('a').exists()).toBeTruthy()
    })

    it('has a change password button with text "form.change-password"', () => {
      expect(wrapper.find('a').text()).toEqual('form.change-password')
    })

    it('has a change password button with a pencil icon', () => {
      expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
    })

    describe('change password from', () => {
      let form

      beforeEach(async () => {
        wrapper.find('a').trigger('click')
        await wrapper.vm.$nextTick()
        form = wrapper.find('form')
      })

      it('has a change password form', () => {
        expect(form.exists()).toBeTruthy()
      })

      it('has a cancel button', () => {
        expect(form.find('svg.bi-x-circle').exists()).toBeTruthy()
      })

      it('closes the form when cancel button is clicked', async () => {
        form.find('svg.bi-x-circle').trigger('click')
        await wrapper.vm.$nextTick()
        expect(wrapper.find('input').exists()).toBeFalsy()
      })

      it('has three input fields', () => {
        expect(form.findAll('input')).toHaveLength(3)
      })

      it('switches the first input type to text when show password is clicked', async () => {
        form.findAll('button').at(0).trigger('click')
        await wrapper.vm.$nextTick()
        expect(form.findAll('input').at(0).attributes('type')).toEqual('text')
      })

      it('switches the second input type to text when show password is clicked', async () => {
        form.findAll('button').at(1).trigger('click')
        await wrapper.vm.$nextTick()
        expect(form.findAll('input').at(1).attributes('type')).toEqual('text')
      })

      it('switches the third input type to text when show password is clicked', async () => {
        form.findAll('button').at(2).trigger('click')
        await wrapper.vm.$nextTick()
        expect(form.findAll('input').at(2).attributes('type')).toEqual('text')
      })

      it('has a submit button', () => {
        expect(form.find('button[type="submit"]').exists()).toBeTruthy()
      })

      /*
      describe('submit', () => {
        beforeEach(async () => {
          await form.findAll('input').at(0).setValue('1234')
          await form.findAll('input').at(1).setValue('Aa123456')
          await form.findAll('input').at(2).setValue('Aa123456')
          form.trigger('submit')
          await wrapper.vm.$nextTick()
          await flushPromises()
        })

        it('calls the API', async () => {
          await wrapper.vm.$nextTick()
          await flushPromises()
expect(changePasswordProfileMock).toHaveBeenCalledWith(1, 'user@example.org', '1234', 'Aa123456')
        })
      })
      */
    })
  })
})
