import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import flushPromises from 'flush-promises'
import Settings from './Settings.vue'
import { createStore } from 'vuex'
import { useRoute } from 'vue-router'
import { BButton, BCol, BForm, BFormGroup, BFormInput, BRow, BTab, BTabs } from 'bootstrap-vue-next'

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

const mockAPIcall = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockAPIcall,
  }),
}))

const t = (key) => key
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t,
  }),
}))

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: {},
  })),
}))

describe('Settings', () => {
  let wrapper
  let store

  const createVuexStore = (state = {}) =>
    createStore({
      state: () => ({
        darkMode: true,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        language: 'en',
        newsletterState: false,
        gmsAllowed: false,
        humhubAllowed: false,
        ...state,
      }),
      mutations: {
        firstName(state, value) {
          state.firstName = value
        },
        lastName(state, value) {
          state.lastName = value
        },
      },
    })

  const createWrapper = (storeState = {}, routeParams = {}) => {
    store = createVuexStore(storeState)
    // Update the mock implementation of useRoute
    vi.mocked(useRoute).mockImplementation(() => ({
      params: routeParams,
    }))
    return mount(Settings, {
      global: {
        plugins: [store],
        mocks: {
          $t: t, // Add this line to mock $t in the component context
        },
        stubs: {
          BTabs,
          BTab,
          BRow,
          BCol,
          BFormInput,
          BFormGroup,
          BForm,
          BButton,
          'user-name': true,
          'user-language': true,
          'user-password': true,
          'user-newsletter': true,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('has a user change language form', () => {
      expect(wrapper.findComponent({ name: 'user-language' }).exists()).toBe(true)
    })

    it('has a user change password form', () => {
      expect(wrapper.findComponent({ name: 'user-password' }).exists()).toBe(true)
    })

    describe('isButtonVisible', () => {
      it('returns false when firstName and lastName match the state', async () => {
        await wrapper.find('[data-test="firstname"]').setValue('John')
        await wrapper.find('[data-test="lastname"]').setValue('Doe')
        await wrapper.find('[data-test="firstname"]').trigger('keyup')
        const result = wrapper.find('[data-test="submit-userdata"]')
        expect(result.exists()).toBe(false)
      })

      it('returns true when either firstName or lastName do not match the state', async () => {
        await wrapper.find('[data-test="firstname"]').setValue('Janer')
        await wrapper.find('[data-test="lastname"]').setValue('Does')
        await wrapper.find('[data-test="firstname"]').trigger('keyup')
        const result = wrapper.find('[data-test="submit-userdata"]')
        expect(result.exists()).toBe(true)
      })
    })

    describe('successful submit', () => {
      beforeEach(async () => {
        await wrapper.find('[data-test="firstname"]').setValue('Janer')
        await wrapper.find('[data-test="lastname"]').setValue('Does')

        mockAPIcall.mockResolvedValue({
          data: {
            updateUserInfos: {
              validValues: 3,
            },
          },
        })

        await wrapper.find('[data-test="submit-userdata"]').trigger('click')
        await flushPromises()
      })

      it('Changes first and lastname', () => {
        expect(mockAPIcall).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Janer',
            lastName: 'Does',
          }),
        )
      })

      it('commits firstname to store', () => {
        expect(store.state.firstName).toBe('Janer')
      })

      it('commits lastname to store', () => {
        expect(store.state.lastName).toBe('Does')
      })

      it('toasts a success message', () => {
        expect(mockToastSuccess).toHaveBeenCalledWith('settings.name.change-success')
      })
    })
  })

  // New test for tabIndex based on route params
  describe('tabIndex', () => {
    it('sets tabIndex to 1 when route.params.tabAlias is "extern"', () => {
      wrapper = createWrapper({}, { tabAlias: 'extern' })
      expect(wrapper.vm.tabIndex).toBe(1)
    })

    it('keeps tabIndex as 0 when route.params.tabAlias is not "extern"', () => {
      wrapper = createWrapper({}, { tabAlias: 'something-else' })
      expect(wrapper.vm.tabIndex).toBe(0)
    })
  })
})
