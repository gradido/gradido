import { mount } from '@vue/test-utils'
import UserCardFormUserData from './UserCard_FormUserData'
import flushPromises from 'flush-promises'

const localVue = global.localVue

const mockAPIcall = jest.fn()

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
        firstName: 'Peter',
        lastName: 'Lustig',
        description: '',
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
    return mount(UserCardFormUserData, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#userdata_form').exists()).toBeTruthy()
    })

    it('has an edit icon', () => {
      expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
    })

    it('renders the first name', () => {
      expect(wrapper.findAll('div.col').at(2).text()).toBe('Peter')
    })

    it('renders the last name', () => {
      expect(wrapper.findAll('div.col').at(4).text()).toBe('Lustig')
    })

    it('renders the description', () => {
      expect(wrapper.findAll('div.col').at(6).text()).toBe('')
    })

    describe('edit user data', () => {
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

      it('does not change the userdate when cancel is clicked', async () => {
        await wrapper.findAll('input').at(0).setValue('Petra')
        await wrapper.findAll('input').at(1).setValue('Lustiger')
        await wrapper.find('textarea').setValue('Keine Nickelbrille')
        await wrapper.find('svg.bi-x-circle').trigger('click')
        expect(wrapper.findAll('div.col').at(2).text()).toBe('Peter')
        expect(wrapper.findAll('div.col').at(4).text()).toBe('Lustig')
        expect(wrapper.findAll('div.col').at(6).text()).toBe('')
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
            state: 'success',
          })
          jest.clearAllMocks()
          await wrapper.findAll('input').at(0).setValue('Petra')
          await wrapper.findAll('input').at(1).setValue('Lustiger')
          await wrapper.find('textarea').setValue('Keine Nickelbrille')
          await wrapper.find('form').trigger('keyup')
          await wrapper.find('button[type="submit"]').trigger('click')
          await flushPromises()
        })

        it('calls the loginAPI', () => {
          expect(mockAPIcall).toBeCalledWith(
            expect.objectContaining({
              variables: {
                sessionId: 1,
                email: 'user@example.org',
                firstName: 'Petra',
                lastName: 'Lustiger',
                description: 'Keine Nickelbrille',
              },
            }),
          )
        })

        it('commits firstname to store', () => {
          expect(storeCommitMock).toBeCalledWith('firstName', 'Petra')
        })

        it('commits lastname to store', () => {
          expect(storeCommitMock).toBeCalledWith('lastName', 'Lustiger')
        })

        it('commits description to store', () => {
          expect(storeCommitMock).toBeCalledWith('description', 'Keine Nickelbrille')
        })

        it('toasts a success message', () => {
          expect(toastSuccessMock).toBeCalledWith('site.profil.user-data.change-success')
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
          await wrapper.findAll('input').at(0).setValue('Petra')
          await wrapper.findAll('input').at(1).setValue('Lustiger')
          await wrapper.find('textarea').setValue('Keine Nickelbrille')
          await wrapper.find('form').trigger('keyup')
          await wrapper.find('button[type="submit"]').trigger('click')
          await flushPromises()
        })

        it('calls the loginAPI', () => {
          expect(mockAPIcall).toBeCalledWith(
            expect.objectContaining({
              variables: {
                sessionId: 1,
                email: 'user@example.org',
                firstName: 'Petra',
                lastName: 'Lustiger',
                description: 'Keine Nickelbrille',
              },
            }),
          )
        })

        it('toasts an error message', () => {
          expect(toastErrorMock).toBeCalledWith('Error')
        })
      })
    })
  })
})
