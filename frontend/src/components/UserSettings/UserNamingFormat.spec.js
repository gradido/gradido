// import { mount } from '@vue/test-utils'
// import UserNamingFormat from './UserNamingFormat.vue'
// import { toastErrorSpy } from '@test/testSetup'
//
// const mockAPIcall = jest.fn()
//
// const storeCommitMock = jest.fn()
//
// const localVue = global.localVue
//
// describe('UserNamingFormat', () => {
//   let wrapper
//   beforeEach(() => {
//     wrapper = mount(UserNamingFormat, {
//       mocks: {
//         $t: (key) => key, // Mocking the translation function
//         $store: {
//           state: {
//             gmsPublishName: null,
//           },
//           commit: storeCommitMock,
//         },
//         $apollo: {
//           mutate: mockAPIcall,
//         },
//       },
//       localVue,
//       propsData: {
//         selectedOption: 'PUBLISH_NAME_ALIAS_OR_INITALS',
//         initialValue: 'PUBLISH_NAME_ALIAS_OR_INITALS',
//         attrName: 'gmsPublishName',
//         successMessage: 'success message',
//       },
//     })
//   })
//
//   afterEach(() => {
//     wrapper.destroy()
//   })
//
//   it('renders the correct dropdown options', () => {
//     const dropdownItems = wrapper.findAll('.dropdown-item')
//     expect(dropdownItems.length).toBe(5)
//
//     const labels = dropdownItems.wrappers.map((item) => item.text())
//     expect(labels).toEqual([
//       'settings.publish-name.alias-or-initials',
//       'settings.publish-name.initials',
//       'settings.publish-name.first',
//       'settings.publish-name.first-initial',
//       'settings.publish-name.name-full',
//     ])
//   })
//
//   it('updates selected option on click', async () => {
//     const dropdownItem = wrapper.findAll('.dropdown-item').at(3) // Click the fourth item
//     await dropdownItem.trigger('click')
//
//     expect(wrapper.emitted().valueChanged).toBeTruthy()
//     expect(wrapper.emitted().valueChanged.length).toBe(1)
//     expect(wrapper.emitted().valueChanged[0]).toEqual(['PUBLISH_NAME_FIRST_INITIAL'])
//   })
//
//   it('does not update when clicking on already selected option', async () => {
//     const dropdownItem = wrapper.findAll('.dropdown-item').at(0) // Click the first item (which is already selected)
//     await dropdownItem.trigger('click')
//
//     expect(wrapper.emitted().valueChanged).toBeFalsy()
//   })
//
//   describe('update with error', () => {
//     beforeEach(async () => {
//       mockAPIcall.mockRejectedValue({
//         message: 'Ouch',
//       })
//       const dropdownItem = wrapper.findAll('.dropdown-item').at(2) // Click the third item
//       await dropdownItem.trigger('click')
//     })
//
//     it('toasts an error message', () => {
//       expect(toastErrorSpy).toBeCalledWith('Ouch')
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UserNamingFormat from './UserNamingFormat.vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next'

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

const mockMutate = vi.fn()

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: mockMutate,
  })),
}))

describe('UserNamingFormat', () => {
  let wrapper
  let store
  let i18n

  const createVuexStore = () =>
    createStore({
      state: {
        gmsPublishName: null,
      },
      mutations: {
        gmsPublishName(state, value) {
          state.gmsPublishName = value
        },
      },
    })

  const createI18nInstance = () =>
    createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          'settings.publish-name.alias-or-initials': 'Alias or Initials',
          'settings.publish-name.initials': 'Initials',
          'settings.publish-name.first': 'First Name',
          'settings.publish-name.first-initial': 'First Initial',
          'settings.publish-name.name-full': 'Full Name',
        },
      },
    })

  beforeEach(() => {
    store = createVuexStore()
    i18n = createI18nInstance()
    wrapper = mount(UserNamingFormat, {
      global: {
        plugins: [store, i18n],
        stubs: {
          BDropdown: { template: '<div><slot /></div>' },
          BDropdownItem: { template: '<span data-test="dropdown-item"/>' },
        },
      },
      props: {
        initialValue: 'PUBLISH_NAME_ALIAS_OR_INITALS',
        attrName: 'gmsPublishName',
        successMessage: 'success message',
      },
    })
  })

  it('renders the correct dropdown options', () => {
    const dropdownItems = wrapper.findAll('[data-test="dropdown-item"]')
    console.log(wrapper.html())
    expect(dropdownItems.length).toBe(5)

    const labels = dropdownItems.map((item) => item.text())
    expect(labels).toEqual([
      'Alias or Initials',
      'Initials',
      'First Name',
      'First Initial',
      'Full Name',
    ])
  })

  it('updates selected option on click', async () => {
    const dropdownItems = wrapper.findAll('[data-test="dropdown-item"]')
    await dropdownItems[3].trigger('click')

    expect(wrapper.emitted('valueChanged')).toBeTruthy()
    expect(wrapper.emitted('valueChanged').length).toBe(1)
    expect(wrapper.emitted('valueChanged')[0]).toEqual(['PUBLISH_NAME_FIRST_INITIAL'])
  })

  it('does not update when clicking on already selected option', async () => {
    const dropdownItems = wrapper.findAll('[data-test="dropdown-item"]')
    await dropdownItems[0].trigger('click')

    expect(wrapper.emitted('valueChanged')).toBeFalsy()
  })

  describe('update with error', () => {
    beforeEach(async () => {
      mockMutate.mockRejectedValue(new Error('Ouch'))
      const dropdownItems = wrapper.findAll('[data-test="dropdown-item"]')
      await dropdownItems[2].trigger('click')
    })

    it('toasts an error message', () => {
      expect(mockToastError).toHaveBeenCalledWith('Ouch')
    })
  })
})
