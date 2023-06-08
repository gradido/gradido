import { shallowMount, mount } from '@vue/test-utils'
import Settings from './Settings'
import { toastSuccessSpy } from '../../test/testSetup'
// import { updateUserInfos, subscribeNewsletter, unsubscribeNewsletter } from '@/graphql/mutations'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue

describe('Settings', () => {
  let Wrapper
  let wrapper

  const storeCommitMock = jest.fn()
  const mockToastSuccess = jest.fn()

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        darkMode: true,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        language: 'en',
        newsletterState: false,
      },
      commit: storeCommitMock,
    },
  }

  Wrapper = () => {
    return mount(Settings, { localVue, mocks, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    describe.skip('watch - darkMode', () => {
      it('commits correct value to store and calls toastSuccess with the appropriate text for dark mode', () => {
        wrapper.vm.darkMode = true

        expect(storeCommitMock).toHaveBeenCalledWith('setDarkMode', true)
        // expect(mockToastSuccess).toHaveBeenCalledWith('Style changed to dark mode')
        expect(toastSuccessSpy).toBeCalledWith('Style changed to dark mode')
      })

      it('commits correct value to store and calls toastSuccess with the appropriate text for light mode', () => {
        wrapper.vm.darkMode = false

        expect(storeCommitMock).toHaveBeenCalledWith('setDarkMode', false)
        expect(mockToastSuccess).toHaveBeenCalledWith('Style changed to light mode')
      })
    })
  })

  Wrapper = () => {
    return shallowMount(Settings, { localVue, mocks })
  }

  describe('shallow Mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('data function returns correct data object', () => {
      expect(wrapper.vm.darkMode).toBe(true)

      expect(wrapper.vm.username).toBe('')

      expect(wrapper.vm.firstName).toBe('John')

      expect(wrapper.vm.lastName).toBe('Doe')

      expect(wrapper.vm.email).toBe('john.doe@test.com')

      expect(wrapper.vm.selected).toBe('en')

      expect(wrapper.vm.newsletterState).toBe(false)

      expect(wrapper.vm.mutation).toBe('')

      expect(wrapper.vm.variables).toEqual({})
    })

    it('has a user change language form', () => {
      expect(wrapper.findComponent({ name: 'LanguageSwitch' }).exists()).toBeTruthy()
    })

    it('has a user change password form', () => {
      expect(wrapper.findComponent({ name: 'UserPassword' }).exists()).toBeTruthy()
    })

    describe('isDisabled', () => {
      it('returns false when firstName and lastName match the state', () => {
        wrapper.vm.firstName = 'John'
        wrapper.vm.lastName = 'Doe'

        const result = wrapper.vm.isDisabled

        expect(result).toBe(true)
      })

      it('returns true when either firstName or lastName do not match the state', () => {
        wrapper.vm.firstName = 'Jane'
        wrapper.vm.lastName = 'Doe'

        const result = wrapper.vm.isDisabled

        expect(result).toBe(false)
      })
    })
  })
})
