import { mount } from '@vue/test-utils'
import UserCardFormUsername from './UserCard_FormUsername'
import flushPromises from 'flush-promises'
import { extend } from 'vee-validate'

const localVue = global.localVue

const mockAPIcall = jest.fn()

// override this rule to avoid API call
extend('gddUsernameUnique', {
  validate(value) {
    return true
  },
})

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()
const storeCommitMock = jest.fn()

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
      commit: storeCommitMock,
    },
    $toasted: {
      success: toastSuccessMock,
      error: toastErrorMock,
    },
    $apollo: {
      query: mockAPIcall,
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
            mockAPIcall.mockResolvedValue({
              data: {
                updateUserInfos: {
                  validValues: 1,
                },
              },
            })
            await wrapper.find('input[placeholder="Username"]').setValue('username')
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('calls the API', () => {
            expect(mockAPIcall).toHaveBeenCalledWith(
              expect.objectContaining({
                variables: {
                  email: 'user@example.org',
                  sessionId: 1,
                  username: 'username',
                },
              }),
            )
          })

          it('displays the new username', () => {
            expect(wrapper.find('div.display-username').text()).toEqual('@username')
          })

          it('commits the username to the store', () => {
            expect(storeCommitMock).toBeCalledWith('username', 'username')
          })

          it('toasts an success message', () => {
            expect(toastSuccessMock).toBeCalledWith('site.profil.user-data.change-success')
          })

          it('has no edit button anymore', () => {
            expect(wrapper.find('svg.bi-pencil').exists()).toBeFalsy()
          })
        })

        describe('submit retruns error', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            mockAPIcall.mockRejectedValue({
              message: 'Ouch!',
            })
            await wrapper.find('input[placeholder="Username"]').setValue('username')
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('calls the API', () => {
            expect(mockAPIcall).toHaveBeenCalledWith(
              expect.objectContaining({
                variables: {
                  email: 'user@example.org',
                  sessionId: 1,
                  username: 'username',
                },
              }),
            )
          })

          it('toasts an error message', () => {
            expect(toastErrorMock).toBeCalledWith('Ouch!')
          })

          it('renders an empty username', () => {
            expect(wrapper.find('div.display-username').text()).toEqual('@')
          })
        })
      })
    })
  })
})
