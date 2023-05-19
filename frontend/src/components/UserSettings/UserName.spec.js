import { mount } from '@vue/test-utils'
import UserName from './UserName'
import flushPromises from 'flush-promises'

import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const mockAPIcall = jest.fn()

const storeCommitMock = jest.fn()

describe('UserName Form', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        username: 'peter',
      },
      commit: storeCommitMock,
    },
    $apollo: {
      mutate: mockAPIcall,
    },
  }

  const Wrapper = () => {
    return mount(UserName, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#username_form').exists()).toBeTruthy()
    })

    it('has an edit icon', () => {
      expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
    })

    it('renders the username', () => {
      expect(wrapper.findAll('div.col').at(2).text()).toBe('peter')
    })

    describe('edit username', () => {
      beforeEach(async () => {
        await wrapper.find('svg.bi-pencil').trigger('click')
      })

      it('shows an cancel icon', () => {
        expect(wrapper.find('svg.bi-x-circle').exists()).toBeTruthy()
      })

      it('closes the input when cancel icon is clicked', async () => {
        await wrapper.find('svg.bi-x-circle').trigger('click')
        expect(wrapper.find('input').exists()).toBeFalsy()
      })

      it('does not change the username when cancel is clicked', async () => {
        await wrapper.find('input').setValue('petra')
        await wrapper.find('svg.bi-x-circle').trigger('click')
        expect(wrapper.findAll('div.col').at(2).text()).toBe('peter')
      })

      it('has a submit button', () => {
        expect(wrapper.find('button[type="submit"]').exists()).toBeTruthy()
      })

      it('does not enable submit button when data is not changed', async () => {
        await wrapper.find('form').trigger('keyup')
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
      })

      describe('successfull submit', () => {
        beforeEach(async () => {
          mockAPIcall.mockResolvedValue({
            data: {
              updateUserInfos: {
                validValues: 3,
              },
            },
          })
          jest.clearAllMocks()
          await wrapper.find('input').setValue('petra')
          await wrapper.find('form').trigger('keyup')
          await wrapper.find('button[type="submit"]').trigger('click')
          await flushPromises()
        })

        it('calls the API', () => {
          expect(mockAPIcall).toBeCalledWith(
            expect.objectContaining({
              variables: {
                alias: 'petra',
              },
            }),
          )
        })

        it('commits username to store', () => {
          expect(storeCommitMock).toBeCalledWith('username', 'petra')
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('settings.username.change-success')
        })

        it('has an edit button again', () => {
          expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
        })
      })

      describe('submit results in server error', () => {
        beforeEach(async () => {
          mockAPIcall.mockRejectedValue({
            message: 'Error',
          })
          jest.clearAllMocks()
          await wrapper.find('input').setValue('petra')
          await wrapper.find('form').trigger('keyup')
          await wrapper.find('button[type="submit"]').trigger('click')
          await flushPromises()
        })

        it('calls the API', () => {
          expect(mockAPIcall).toBeCalledWith(
            expect.objectContaining({
              variables: {
                alias: 'petra',
              },
            }),
          )
        })

        it('toasts an error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Error')
        })
      })
    })

    describe('no username in store', () => {
      beforeEach(() => {
        mocks.$store.state.username = null
        wrapper = Wrapper()
      })

      it('displays an information why to enter a username', () => {
        expect(wrapper.findAll('div.col').at(2).text()).toBe('settings.username.no-username')
      })
    })
  })
})
