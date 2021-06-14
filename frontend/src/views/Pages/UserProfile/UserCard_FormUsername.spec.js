import { mount } from '@vue/test-utils'
import { extend } from 'vee-validate'
import UserCardFormUsername from './UserCard_FormUsername'
import loginAPI from '../../../apis/loginAPI'
import flushPromises from 'flush-promises'

jest.mock('../../../apis/loginAPI')

extend('gddUsernameRgex', {
  validate(value) {
    return true
  },
})

extend('gddUsernameUnique', {
  validate(value) {
    return true
  },
})

const localVue = global.localVue

const mockAPIcall = jest.fn((args) => {
  return { success: true }
})

loginAPI.changeUsernameProfile = mockAPIcall

describe('UserCard_FormUsername', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        sessionId: 1,
        email: 'user@example.org',
        username: '',
      },
      commit: jest.fn(),
    },
    $toast: {
      success: jest.fn(),
    },
  }

  const Wrapper = () => {
    return mount(UserCardFormUsername, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#formusername').exists()).toBeTruthy()
    })

    describe('username in store is empty', () => {
      it('renders an empty username', () => {
        expect(wrapper.find('div.display-username').text()).toEqual('@')
      })

      it('has an edit icon', () => {
        expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
      })

      describe('edit username', () => {
        beforeEach(async () => {
          await wrapper.find('svg.bi-pencil').trigger('click')
        })

        it('shows an input field for the username', () => {
          expect(wrapper.find('input[placeholder="Username"]').exists()).toBeTruthy()
        })

        it('shows an cancel icon', () => {
          expect(wrapper.find('svg.bi-x-circle').exists()).toBeTruthy()
        })

        it('closes the input when cancel icon is clicked', async () => {
          wrapper.find('svg.bi-x-circle').trigger('click')
          await wrapper.vm.$nextTick()
          expect(wrapper.find('input[placeholder="Username"]').exists()).toBeFalsy()
        })

        it('does not change the username when cancel is clicked', async () => {
          wrapper.find('input[placeholder="Username"]').setValue('username')
          wrapper.find('svg.bi-x-circle').trigger('click')
          await wrapper.vm.$nextTick()
          expect(wrapper.find('div.display-username').text()).toEqual('@')
        })

        it('has a submit button', () => {
          expect(wrapper.find('button[type="submit"]').exists()).toBeTruthy()
        })

        describe('successfull submit', () => {
          beforeEach(async () => {
            await wrapper.find('input[placeholder="Username"]').setValue('username')
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('calls the loginAPI', () => {
            expect(mockAPIcall).toHaveBeenCalledWith(1, 'user@example.org', 'username')
          })

          it('displays the new username', () => {
            expect(wrapper.find('div.display-username').text()).toEqual('@username')
          })

          it('has no edit button anymore', () => {
            expect(wrapper.find('svg.bi-pencil').exists()).toBeFalsy()
          })
        })
      })
    })
  })
})
