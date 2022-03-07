import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import UserCardFormUserMail from './UserCard_FormUserMail'

const localVue = global.localVue
jest.spyOn(window, 'alert').mockImplementation(() => {})

const mockAPIcall = jest.fn()

describe('UserCard_FormUserMail', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        email: 'user@example.org',
        firstName: 'Peter',
        lastName: 'Lustig',
        description: '',
      },
    },
    $apollo: {
      mutate: mockAPIcall,
    },
  }

  const Wrapper = () => {
    return mount(UserCardFormUserMail, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#formusermail').exists()).toBeTruthy()
    })

    it('renders the edit link', () => {
      expect(wrapper.find('a[href="#formusermail"]').exists()).toBeTruthy()
    })

    it('renders the E-Mail form.change', () => {
      expect(wrapper.findAll('div.col').at(0).text()).toBe('E-Mail form.change')
    })

    it('renders the E-Mail', () => {
      expect(wrapper.findAll('div.col').at(1).text()).toBe('E-Mail')
    })

    it('renders the E-Mail Adress', () => {
      expect(wrapper.findAll('div.col').at(2).text()).toBe('user@example.org')
    })

    describe('edit user data', () => {
      beforeEach(async () => {
        await wrapper.find('a[href="#formusermail"]').trigger('click')
        await flushPromises()
        await wrapper.findAll('input').at(0).setValue('test@example.org')
        await flushPromises()
      })

      describe('error API send', () => {
        beforeEach(async () => {
          mockAPIcall.mockRejectedValue({
            message: 'Ouch!',
          })
          await wrapper.find('a[href="#formusermail"]').trigger('click')
          await flushPromises()
        })

        it('sends request with filled variables to the API', async () => {
          expect(mockAPIcall).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                newEmail: 'test@example.org',
              },
            }),
          )
        })

        it('shows an error message', async () => {
          expect(window.alert).toBeCalledWith('Ouch!')
        })
      })

      describe('successful API send', () => {
        beforeEach(async () => {
          mockAPIcall.mockResolvedValue({
            data: {
              updateUserInfos: {
                validValues: 1,
              },
            },
          })
          await wrapper.find('a[href="#formusermail"]').trigger('click')
          await flushPromises()
        })

        it('sends request with filled variables to the API', async () => {
          expect(mockAPIcall).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                newEmail: 'test@example.org',
              },
            }),
          )
        })

        it('sends a success message', async () => {
          expect(window.alert).toBeCalledWith('changePassword success')
        })
      })
    })
  })
})
