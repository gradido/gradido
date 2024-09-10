// import { mount } from '@vue/test-utils'
// import CreationFormular from './CreationFormular'
// import { adminCreateContribution } from '../graphql/adminCreateContribution'
// import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'
// import VueApollo from 'vue-apollo'
// import { createMockClient } from 'mock-apollo-client'
// import { adminOpenCreations } from '../graphql/adminOpenCreations'
//
// const mockClient = createMockClient()
// const apolloProvider = new VueApollo({
//   defaultClient: mockClient,
// })
//
// const localVue = global.localVue
// localVue.use(VueApollo)
//
// const stateCommitMock = jest.fn()
//
// const mocks = {
//   $t: jest.fn((t, options) => (options ? [t, options] : t)),
//   $d: jest.fn((d) => {
//     const date = new Date(d)
//     return date.toISOString().split('T')[0]
//   }),
//   $store: {
//     commit: stateCommitMock,
//   },
// }
//
// const propsData = {
//   type: '',
//   creation: [],
// }
//
// const now = new Date()
//
// const getCreationDate = (sub) => {
//   const date = sub === 0 ? now : new Date(now.getFullYear(), now.getMonth() - sub, 1, 0)
//   return date.toISOString().split('T')[0]
// }
//
// describe('CreationFormular', () => {
//   let wrapper
//
//   const adminOpenCreationsMock = jest.fn()
//   const adminCreateContributionMock = jest.fn()
//   mockClient.setRequestHandler(
//     adminOpenCreations,
//     adminOpenCreationsMock.mockResolvedValue({
//       data: {
//         adminOpenCreations: [
//           {
//             month: new Date(now.getFullYear(), now.getMonth() - 2).getMonth(),
//             year: new Date(now.getFullYear(), now.getMonth() - 2).getFullYear(),
//             amount: '200',
//           },
//           {
//             month: new Date(now.getFullYear(), now.getMonth() - 1).getMonth(),
//             year: new Date(now.getFullYear(), now.getMonth() - 1).getFullYear(),
//             amount: '400',
//           },
//           {
//             month: now.getMonth(),
//             year: now.getFullYear(),
//             amount: '600',
//           },
//         ],
//       },
//     }),
//   )
//   mockClient.setRequestHandler(
//     adminCreateContribution,
//     adminCreateContributionMock.mockResolvedValue({
//       data: {
//         adminCreateContribution: [0, 0, 0],
//       },
//     }),
//   )
//
//   const Wrapper = () => {
//     return mount(CreationFormular, { localVue, mocks, propsData, apolloProvider })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('has a DIV element with the class.component-creation-formular', () => {
//       expect(wrapper.find('.component-creation-formular').exists()).toBeTruthy()
//     })
//
//     describe('text and value form props', () => {
//       beforeEach(async () => {
//         wrapper = mount(CreationFormular, {
//           localVue,
//           mocks,
//           propsData: {
//             creationUserData: { memo: 'Memo from property', amount: 42 },
//             ...propsData,
//           },
//         })
//       })
//
//       it('has text taken from props', () => {
//         expect(wrapper.vm.text).toBe('Memo from property')
//       })
//
//       it('has value taken from props', () => {
//         expect(wrapper.vm.value).toBe(42)
//       })
//     })
//
//     describe('radio buttons to selcet month', () => {
//       it('has three radio buttons', () => {
//         expect(wrapper.findAll('input[type="radio"]').length).toBe(3)
//       })
//
//       describe('with single creation', () => {
//         beforeEach(async () => {
//           jest.clearAllMocks()
//           await wrapper.setProps({
//             type: 'singleCreation',
//             creation: [200, 400, 600],
//             item: { email: 'benjamin@bluemchen.de' },
//           })
//           await wrapper.findAll('input[type="radio"]').at(1).setChecked()
//           await wrapper.find('input[type="number"]').setValue(90)
//         })
//
//         describe('first radio button', () => {
//           beforeEach(async () => {
//             await wrapper.findAll('input[type="radio"]').at(0).setChecked()
//             await wrapper.find('textarea').setValue('Test create coins')
//           })
//
//           it('sets rangeMax to 200', () => {
//             expect(wrapper.vm.rangeMax).toBe(200)
//           })
//
//           describe('sendForm', () => {
//             beforeEach(async () => {
//               await wrapper.find('.test-submit').trigger('click')
//             })
//
//             it('sends ... to apollo', () => {
//               expect(adminCreateContributionMock).toBeCalledWith({
//                 email: 'benjamin@bluemchen.de',
//                 creationDate: getCreationDate(2),
//                 amount: 90,
//                 memo: 'Test create coins',
//               })
//             })
//
//             it('emits update-user-data', () => {
//               expect(wrapper.emitted('update-user-data')).toEqual([
//                 [{ email: 'benjamin@bluemchen.de' }, [0, 0, 0]],
//               ])
//             })
//
//             it('toasts a success message', () => {
//               expect(toastSuccessSpy).toBeCalledWith([
//                 'creation_form.toasted',
//                 { email: 'benjamin@bluemchen.de', value: '90' },
//               ])
//             })
//
//             it('updates open creations in store', () => {
//               expect(stateCommitMock).toBeCalledWith('openCreationsPlus', 1)
//             })
//
//             it('resets the form data', () => {
//               expect(wrapper.vm.value).toBe(0)
//             })
//           })
//
//           describe('sendForm with server error', () => {
//             beforeEach(async () => {
//               adminCreateContributionMock.mockRejectedValueOnce({ message: 'Ouch!' })
//               await wrapper.find('.test-submit').trigger('click')
//             })
//
//             it('toasts an error message', () => {
//               expect(toastErrorSpy).toBeCalledWith('Ouch!')
//             })
//           })
//
//           describe('Negativ value', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ value: -20 })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//
//           describe('Empty text', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ text: '' })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//
//           describe('Text length less than 10', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ text: 'Try this' })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//         })
//
//         describe('second radio button', () => {
//           beforeEach(async () => {
//             await wrapper.findAll('input[type="radio"]').at(1).setChecked()
//           })
//
//           it('sets rangeMin to 0', () => {
//             expect(wrapper.vm.rangeMin).toBe(0)
//           })
//
//           it('sets rangeMax to 400', () => {
//             expect(wrapper.vm.rangeMax).toBe(400)
//           })
//
//           describe('sendForm', () => {
//             beforeEach(async () => {
//               await wrapper.find('.test-submit').trigger('click')
//             })
//
//             it('sends ... to apollo', () => {
//               expect(adminCreateContributionMock).toBeCalled()
//             })
//           })
//
//           describe('Negativ value', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ value: -20 })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//
//           describe('Empty text', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ text: '' })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//
//           describe('Text length less than 10', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ text: 'Try this' })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//         })
//
//         describe('third radio button', () => {
//           beforeEach(async () => {
//             await wrapper.findAll('input[type="radio"]').at(2).setChecked()
//           })
//
//           it('sets rangeMin to 0', () => {
//             expect(wrapper.vm.rangeMin).toBe(0)
//           })
//
//           it('sets rangeMax to 400', () => {
//             expect(wrapper.vm.rangeMax).toBe(600)
//           })
//
//           describe('sendForm', () => {
//             beforeEach(async () => {
//               await wrapper.find('.test-submit').trigger('click')
//             })
//
//             it('sends mutation to apollo', () => {
//               expect(adminCreateContributionMock).toBeCalled()
//             })
//
//             it('toast success message', () => {
//               expect(toastSuccessSpy).toBeCalled()
//             })
//
//             it('store commit openCreationPlus', () => {
//               expect(stateCommitMock).toBeCalledWith('openCreationsPlus', 1)
//             })
//           })
//
//           describe('Negativ value', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ value: -20 })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//
//           describe('Empty text', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ text: '' })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//
//           describe('Text length less than 10', () => {
//             beforeEach(async () => {
//               jest.clearAllMocks()
//               await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
//               await wrapper.setData({ rangeMin: 180 })
//               await wrapper.setData({ text: 'Try this' })
//             })
//
//             it('has no submit button', async () => {
//               expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
//             })
//           })
//         })
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CreationFormular from './CreationFormular.vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { createStore } from 'vuex'
import useCreationMonths from '../composables/useCreationMonths'
import {
  BButton,
  BForm,
  BFormInput,
  BFormRadioGroup,
  BFormTextarea,
  BInputGroup,
} from 'bootstrap-vue-next'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')
vi.mock('../composables/useCreationMonths')

const createVuexStore = () => {
  return createStore({
    state: {},
    mutations: {
      openCreationsPlus: vi.fn(),
    },
  })
}

describe('CreationFormular', () => {
  let wrapper
  let store
  const mockMutate = vi.fn()
  const mockRefetch = vi.fn()
  const mockT = vi.fn((key, options) => (options ? `${key} ${JSON.stringify(options)}` : key))
  const mockD = vi.fn((date) => new Date(date).toISOString().split('T')[0])
  const mockToastSuccess = vi.fn()
  const mockToastError = vi.fn()
  const now = new Date()

  beforeEach(() => {
    store = createVuexStore()

    useMutation.mockReturnValue({
      mutate: mockMutate,
    })

    useQuery.mockReturnValue({
      refetch: mockRefetch,
    })

    useI18n.mockReturnValue({
      t: mockT,
      d: mockD,
    })

    useAppToast.mockReturnValue({
      toastSuccess: mockToastSuccess,
      toastError: mockToastError,
    })

    const creationDateObjects = [
      {
        short: 'Jan',
        year: now.getFullYear(),
        date: new Date(now.getFullYear(), 0, 1).toISOString(),
      },
      {
        short: 'Feb',
        year: now.getFullYear(),
        date: new Date(now.getFullYear(), 1, 1).toISOString(),
      },
      {
        short: 'Mar',
        year: now.getFullYear(),
        date: new Date(now.getFullYear(), 2, 1).toISOString(),
      },
    ]

    useCreationMonths.mockReturnValue({
      creationDateObjects,
    })

    wrapper = mount(CreationFormular, {
      props: {
        pagetype: '',
        item: { email: 'test@example.com' },
        items: [],
        creationUserData: {},
        creation: [200, 400, 600],
      },
      global: {
        plugins: [store],
        stubs: {
          BForm,
          BFormRadioGroup,
          BInputGroup,
          BFormInput,
          BFormTextarea,
          BButton,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.component-creation-formular').exists()).toBe(true)
  })

  it('computes radio options correctly', () => {
    expect(wrapper.vm.radioOptions).toHaveLength(3)
    expect(wrapper.vm.radioOptions[0].name).toBe('Jan 200 GDD')
    expect(wrapper.vm.radioOptions[1].name).toBe('Feb 400 GDD')
    expect(wrapper.vm.radioOptions[2].name).toBe('Mar 600 GDD')
  })

  it('updates form when radio option is selected', async () => {
    await wrapper.setData({ selected: wrapper.vm.radioOptions[1].item })
    expect(wrapper.vm.text).toBe(
      'creation_form.creation_for {"short":"Feb","year":' + now.getFullYear() + '}',
    )
    expect(wrapper.vm.rangeMin).toBe(0)
    expect(wrapper.vm.rangeMax).toBe(400)
  })

  it('submits creation successfully', async () => {
    await wrapper.setData({
      selected: wrapper.vm.radioOptions[0].item,
      value: 100,
      text: 'Valid creation text',
    })
    mockMutate.mockResolvedValueOnce({ data: { adminCreateContribution: [0, 0, 0] } })

    await wrapper.find('.test-submit').trigger('click')

    expect(mockMutate).toHaveBeenCalledWith({
      email: 'test@example.com',
      creationDate: expect.any(String),
      amount: 100,
      memo: 'Valid creation text',
    })
    expect(mockToastSuccess).toHaveBeenCalled()
    expect(store.commit).toHaveBeenCalledWith('openCreationsPlus', 1)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('handles creation submission error', async () => {
    await wrapper.setData({
      selected: wrapper.vm.radioOptions[0].item,
      value: 100,
      text: 'Valid creation text',
    })
    mockMutate.mockRejectedValueOnce(new Error('Submission failed'))

    await wrapper.find('.test-submit').trigger('click')

    expect(mockToastError).toHaveBeenCalledWith('Submission failed')
  })

  it('resets form on reset button click', async () => {
    await wrapper.setData({
      selected: wrapper.vm.radioOptions[0].item,
      value: 100,
      text: 'Some text',
    })
    await wrapper.find('button[type="reset"]').trigger('click')

    expect(wrapper.vm.text).toBe('')
    expect(wrapper.vm.value).toBe(0)
    expect(wrapper.vm.selected).toBe(null)
  })
})
