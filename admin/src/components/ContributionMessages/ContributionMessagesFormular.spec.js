// import { mount } from '@vue/test-utils'
// import ContributionMessagesFormular from './ContributionMessagesFormular'
// import { toastErrorSpy, toastSuccessSpy } from '../../../test/testSetup'
// import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'
// import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'
//
// const localVue = global.localVue
//
// const apolloMutateMock = jest.fn().mockResolvedValue()
//
// describe('ContributionMessagesFormular', () => {
//   let wrapper
//
//   const propsData = {
//     contributionId: 42,
//     contributionMemo: 'It is a test memo',
//     hideResubmission: true,
//   }
//
//   const mocks = {
//     $t: jest.fn((t) => t),
//     $apollo: {
//       mutate: apolloMutateMock,
//     },
//     $i18n: {
//       locale: 'en',
//     },
//   }
//
//   const Wrapper = () => {
//     return mount(ContributionMessagesFormular, {
//       localVue,
//       mocks,
//       propsData,
//     })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//       jest.clearAllMocks()
//     })
//
//     it('has a DIV .contribution-messages-formular', () => {
//       expect(wrapper.find('div.contribution-messages-formular').exists()).toBe(true)
//     })
//
//     describe('on trigger reset', () => {
//       beforeEach(async () => {
//         wrapper.setData({
//           form: {
//             text: 'text form message',
//           },
//         })
//         await wrapper.find('form').trigger('reset')
//       })
//
//       it('form has empty text and memo reset to contribution memo input', () => {
//         expect(wrapper.vm.form).toEqual({
//           text: '',
//           memo: 'It is a test memo',
//         })
//       })
//     })
//
//     describe('on trigger submit', () => {
//       beforeEach(async () => {
//         wrapper.setData({
//           form: {
//             text: 'text form message',
//           },
//         })
//         await wrapper.find('form').trigger('submit')
//       })
//
//       it('emitted "get-list-contribution-messages" with data', async () => {
//         expect(wrapper.emitted('get-list-contribution-messages')).toEqual(
//           expect.arrayContaining([expect.arrayContaining([42])]),
//         )
//       })
//
//       it('emitted "update-status" with data', async () => {
//         expect(wrapper.emitted('update-status')).toEqual(
//           expect.arrayContaining([expect.arrayContaining([42])]),
//         )
//       })
//     })
//
//     describe('send DIALOG contribution message with success', () => {
//       beforeEach(async () => {
//         await wrapper.setData({
//           form: {
//             text: 'text form message',
//           },
//         })
//         await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
//       })
//
//       it('moderatorMessage has `DIALOG`', () => {
//         expect(apolloMutateMock).toBeCalledWith({
//           mutation: adminCreateContributionMessage,
//           variables: {
//             contributionId: 42,
//             message: 'text form message',
//             messageType: 'DIALOG',
//             resubmissionAt: null,
//           },
//         })
//       })
//
//       it('toasts an success message', () => {
//         expect(toastSuccessSpy).toBeCalledWith('message.request')
//       })
//     })
//
//     describe('send MODERATOR contribution message with success', () => {
//       beforeEach(async () => {
//         await wrapper.setData({
//           form: {
//             text: 'text form message',
//           },
//         })
//
//         // choose tab
//         // tabs: text | moderator | memo
//         //         0  |     1     |  2
//         await wrapper
//           .find('div[data-test="message-type-tabs"]')
//           .findAll('.nav-item a')
//           .at(1)
//           .trigger('click')
//
//         // click save
//         await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
//       })
//
//       it('moderatorMesage has `MODERATOR`', () => {
//         expect(apolloMutateMock).toBeCalledWith({
//           mutation: adminCreateContributionMessage,
//           variables: {
//             contributionId: 42,
//             message: 'text form message',
//             messageType: 'MODERATOR',
//             resubmissionAt: null,
//           },
//         })
//       })
//
//       it('toasts an success message', () => {
//         expect(toastSuccessSpy).toBeCalledWith('message.request')
//       })
//     })
//
//     describe('send resubmission contribution message with success', () => {
//       const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days in milliseconds
//
//       beforeEach(async () => {
//         await wrapper.setData({
//           form: {
//             text: 'text form message',
//           },
//           showResubmissionDate: true,
//           resubmissionDate: futureDate,
//           resubmissionTime: '08:46',
//         })
//         await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
//       })
//
//       it('graphql payload contain resubmission date', () => {
//         const futureDateExactTime = futureDate
//         futureDateExactTime.setHours(8)
//         futureDateExactTime.setMinutes(46)
//         expect(apolloMutateMock).toBeCalledWith({
//           mutation: adminCreateContributionMessage,
//           variables: {
//             contributionId: 42,
//             message: 'text form message',
//             messageType: 'DIALOG',
//             resubmissionAt: futureDateExactTime.toString(),
//           },
//         })
//       })
//
//       it('toasts an success message', () => {
//         expect(toastSuccessSpy).toBeCalledWith('message.request')
//       })
//     })
//
//     describe('set memo', () => {
//       beforeEach(async () => {
//         // choose tab
//         // tabs: text | moderator | memo
//         //         0  |     1     |  2
//         await wrapper
//           .find('div[data-test="message-type-tabs"]')
//           .findAll('.nav-item a')
//           .at(2)
//           .trigger('click')
//
//         // click save
//         await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
//       })
//       it('check tabindex value is 2', () => {
//         expect(wrapper.vm.tabindex).toBe(2)
//       })
//     })
//
//     describe('update contribution memo from moderator for user created contributions', () => {
//       beforeEach(async () => {
//         await wrapper.setData({
//           form: {
//             memo: 'changed memo',
//           },
//           tabindex: 2,
//         })
//         await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
//       })
//
//       it('adminUpdateContribution was called with contributionId and updated memo', () => {
//         expect(apolloMutateMock).toBeCalledWith({
//           mutation: adminUpdateContribution,
//           variables: {
//             id: 42,
//             memo: 'changed memo',
//             resubmissionAt: null,
//           },
//         })
//       })
//
//       it('toasts an success message', () => {
//         expect(toastSuccessSpy).toBeCalledWith('message.request')
//       })
//     })
//
//     describe('send contribution message with error', () => {
//       beforeEach(async () => {
//         apolloMutateMock.mockRejectedValue({ message: 'OUCH!' })
//         wrapper = Wrapper()
//         await wrapper.find('form').trigger('submit')
//       })
//
//       it('toasts an error message', () => {
//         expect(toastErrorSpy).toBeCalledWith('OUCH!')
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStore } from 'vuex'
import ContributionMessagesFormular from './ContributionMessagesFormular.vue'
import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'
import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'
import { useAppToast } from '@/composables/useToast'
import {
  BButton,
  BCol,
  BForm,
  BFormCheckbox,
  BFormGroup,
  BFormInput,
  BFormTextarea,
  BRow,
  BTab,
  BTabs,
  BTooltip,
} from 'bootstrap-vue-next'

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  })),
}))

const mockCreateContributionMessageMutate = vi.fn().mockResolvedValue({})
const mockUpdateContributionMutate = vi.fn().mockResolvedValue({})

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn((mutation) => {
    if (mutation === adminCreateContributionMessage) {
      return { mutate: mockCreateContributionMessageMutate }
    }
    if (mutation === adminUpdateContribution) {
      return { mutate: mockUpdateContributionMutate }
    }
    return { mutate: vi.fn() }
  }),
}))

describe('ContributionMessagesFormular', () => {
  let wrapper
  const { toastSuccess, toastError } = useAppToast()

  const createWrapper = (props = {}) => {
    return mount(ContributionMessagesFormular, {
      props: {
        contributionId: 42,
        contributionMemo: 'It is a test memo',
        hideResubmission: true,
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
          $i18n: {
            locale: 'en',
          },
        },
        stubs: {
          BForm,
          BFormGroup,
          BFormCheckbox,
          BFormInput,
          BFormTextarea,
          BTabs,
          BTab,
          BTooltip,
          BRow,
          BCol,
          BButton,
          TimePicker: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  it('has a DIV .contribution-messages-formular', () => {
    expect(wrapper.find('div.contribution-messages-formular').exists()).toBe(true)
  })

  describe('on trigger reset', () => {
    it('form has empty text and memo reset to contribution memo input', async () => {
      wrapper.vm.form.text = 'text form message'

      await wrapper.find('form').trigger('reset')
      expect(wrapper.vm.form).toEqual({
        text: '',
        memo: 'It is a test memo',
      })
    })
  })

  describe('on trigger submit', () => {
    it('emits correct events', async () => {
      wrapper.vm.form.text = 'text form message'
      await wrapper.find('form').trigger('submit')

      expect(wrapper.emitted('get-list-contribution-messages')).toEqual([[42]])
      expect(wrapper.emitted('update-status')).toEqual([[42]])
    })
  })

  describe('send DIALOG contribution message with success', () => {
    beforeEach(async () => {
      wrapper.vm.form.text = 'text form message'
      await wrapper.find('[data-test="submit-dialog"]').trigger('click')
    })

    it('calls mutation with correct parameters', () => {
      expect(mockCreateContributionMessageMutate).toHaveBeenCalledWith({
        contributionId: 42,
        message: 'text form message',
        messageType: 'DIALOG',
        resubmissionAt: null,
      })
    })

    it('toasts a success message', () => {
      expect(toastSuccess).toHaveBeenCalledWith('message.request')
    })
  })

  describe('send MODERATOR contribution message with success', () => {
    beforeEach(async () => {
      wrapper.vm.form.text = 'text form message'
      wrapper.vm.tabindex.value = 1
      await wrapper.find('[data-test="submit-dialog"]').trigger('click')
    })

    it('calls mutation with correct parameters', () => {
      expect(mockCreateContributionMessageMutate).toHaveBeenCalledWith({
        contributionId: 42,
        message: 'text form message',
        messageType: 'MODERATOR',
        resubmissionAt: null,
      })
    })

    it('toasts a success message', () => {
      expect(toastSuccess).toHaveBeenCalledWith('message.request')
    })
  })

  describe('send resubmission contribution message with success', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days in milliseconds

    beforeEach(async () => {
      wrapper.vm.form.text = 'text form message'
      wrapper.vm.showResubmissionDate.value = true
      wrapper.vm.resubmissionDate.value = futureDate
      wrapper.vm.resubmissionTime.value = '08:46'

      await wrapper.find('[data-test="submit-dialog"]').trigger('click')
    })

    it('calls mutation with correct parameters including resubmission date', () => {
      const futureDateExactTime = new Date(futureDate)
      futureDateExactTime.setHours(8)
      futureDateExactTime.setMinutes(46)
      expect(mockCreateContributionMessageMutate).toHaveBeenCalledWith({
        contributionId: 42,
        message: 'text form message',
        messageType: 'DIALOG',
        resubmissionAt: futureDateExactTime.toString(),
      })
    })

    it('toasts a success message', () => {
      expect(toastSuccess).toHaveBeenCalledWith('message.request')
    })
  })

  describe('update contribution memo from moderator for user created contributions', () => {
    beforeEach(async () => {
      wrapper.vm.form.memo = 'changed memo'
      wrapper.vm.tabindex.value = 2

      await wrapper.find('[data-test="submit-dialog"]').trigger('click')
    })

    it('calls mutation with correct parameters', () => {
      expect(mockUpdateContributionMutate).toHaveBeenCalledWith({
        id: 42,
        memo: 'changed memo',
        resubmissionAt: null,
      })
    })

    it('toasts a success message', () => {
      expect(toastSuccess).toHaveBeenCalledWith('message.request')
    })
  })

  describe('send contribution message with error', () => {
    beforeEach(async () => {
      mockCreateContributionMessageMutate.mockRejectedValueOnce({ message: 'OUCH!' })
      await wrapper.find('form').trigger('submit')
    })

    it('toasts an error message', () => {
      expect(toastError).toHaveBeenCalledWith('OUCH!')
    })
  })
})
