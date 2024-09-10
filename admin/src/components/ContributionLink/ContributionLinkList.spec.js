// import { mount } from '@vue/test-utils'
// import ContributionLinkList from './ContributionLinkList'
// import { toastSuccessSpy, toastErrorSpy } from '../../../test/testSetup'
// // import { deleteContributionLink } from '../graphql/deleteContributionLink'
//
// const localVue = global.localVue
//
// const mockAPIcall = jest.fn()
//
// const mocks = {
//   $t: jest.fn((t) => t),
//   $d: jest.fn((d) => d),
//   $apollo: {
//     mutate: mockAPIcall,
//   },
// }
//
// const propsData = {
//   items: [
//     {
//       id: 1,
//       name: 'Meditation',
//       memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
//       amount: '200',
//       validFrom: '2022-04-01',
//       validTo: '2022-08-01',
//       cycle: 'täglich',
//       maxPerCycle: '3',
//       maxAmountPerMonth: 0,
//       link: 'https://localhost/redeem/CL-1a2345678',
//     },
//   ],
// }
//
// describe('ContributionLinkList', () => {
//   let wrapper
//
//   const Wrapper = () => {
//     return mount(ContributionLinkList, { localVue, mocks, propsData })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the Div Element ".contribution-link-list"', () => {
//       expect(wrapper.find('div.contribution-link-list').exists()).toBe(true)
//     })
//
//     it('renders table with contribution link', () => {
//       expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(0).text()).toContain(
//         'Meditation',
//       )
//     })
//
//     describe('edit contribution link', () => {
//       beforeEach(() => {
//         wrapper.vm.editContributionLink()
//       })
//
//       it('emits editContributionLinkData', async () => {
//         expect(wrapper.vm.$emit('editContributionLinkData')).toBeTruthy()
//       })
//     })
//
//     describe('delete contribution link', () => {
//       let spy
//
//       beforeEach(async () => {
//         jest.clearAllMocks()
//         wrapper.vm.deleteContributionLink()
//       })
//
//       describe('with success', () => {
//         beforeEach(async () => {
//           spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//           spy.mockImplementation(() => Promise.resolve('some value'))
//           mockAPIcall.mockResolvedValue()
//           await wrapper.find('.test-delete-link').trigger('click')
//         })
//
//         it('opens the modal ', () => {
//           expect(spy).toBeCalled()
//         })
//
//         it.skip('calls the API', () => {
//           // expect(mockAPIcall).toBeCalledWith(
//           //   expect.objectContaining({
//           //     mutation: deleteContributionLink,
//           //     variables: {
//           //       id: 1,
//           //     },
//           //   }),
//           // )
//         })
//
//         it('toasts a success message', () => {
//           expect(toastSuccessSpy).toBeCalledWith('contributionLink.deleted')
//         })
//       })
//
//       describe('with error', () => {
//         beforeEach(async () => {
//           spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//           spy.mockImplementation(() => Promise.resolve('some value'))
//           mockAPIcall.mockRejectedValue({ message: 'Something went wrong :(' })
//           await wrapper.find('.test-delete-link').trigger('click')
//         })
//
//         it('toasts an error message', () => {
//           expect(toastErrorSpy).toBeCalledWith('Something went wrong :(')
//         })
//       })
//
//       describe('cancel delete', () => {
//         beforeEach(async () => {
//           spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//           spy.mockImplementation(() => Promise.resolve(false))
//           mockAPIcall.mockResolvedValue()
//           await wrapper.find('.test-delete-link').trigger('click')
//         })
//
//         it('does not call the API', () => {
//           expect(mockAPIcall).not.toBeCalled()
//         })
//       })
//     })
//
//     describe('onClick showButton', () => {
//       it('modelData contains contribution link', () => {
//         wrapper.find('button.test-show').trigger('click')
//         expect(wrapper.vm.modalData).toEqual({
//           amount: '200',
//           cycle: 'täglich',
//           id: 1,
//           link: 'https://localhost/redeem/CL-1a2345678',
//           maxAmountPerMonth: 0,
//           maxPerCycle: '3',
//           memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
//           name: 'Meditation',
//           validFrom: '2022-04-01',
//           validTo: '2022-08-01',
//         })
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionLinkList from './ContributionLinkList.vue'
import { useAppToast } from '@/composables/useToast'
import { useMutation } from '@vue/apollo-composable'
import { BButton, BCard, BCardText, BModal, BTable, useModal } from 'bootstrap-vue-next'
import { nextTick } from 'vue'

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  })),
}))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn().mockResolvedValue({}),
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key) => key,
    d: vi.fn((date) => date.toISOString().split('T')[0]),
  })),
}))

const mockItems = [
  {
    id: 1,
    name: 'Meditation',
    memo: 'Lorem ipsum dolor sit amet',
    amount: '200',
    validFrom: '2022-04-01',
    validTo: '2022-08-01',
    cycle: 'täglich',
    maxPerCycle: '3',
    maxAmountPerMonth: 0,
    link: 'https://localhost/redeem/CL-1a2345678',
  },
]

describe('ContributionLinkList', () => {
  let wrapper
  const mockToastError = vi.fn()
  const mockToastSuccess = vi.fn()

  const createWrapper = () => {
    return mount(ContributionLinkList, {
      props: {
        items: mockItems,
      },
      global: {
        stubs: {
          BTable,
          BButton,
          IBiTrash: true,
          IBiPencil: true,
          IBiEye: true,
          BModal,
          BCard,
          BCardText,
          'figure-qr-code': true,
        },
      },
    })
  }

  beforeEach(() => {
    useAppToast.mockReturnValue({
      toastError: mockToastError,
      toastSuccess: mockToastSuccess,
    })

    wrapper = createWrapper()
  })

  it('renders the Div Element ".contribution-link-list"', () => {
    expect(wrapper.find('div.contribution-link-list').exists()).toBe(true)
  })

  it('renders table with contribution link', () => {
    expect(wrapper.findComponent({ name: 'BTable' }).props('items')).toEqual(mockItems)
  })

  it('emits edit-contribution-link-data when editContributionLink is called', async () => {
    await wrapper.vm.editContributionLink(mockItems[0])
    expect(wrapper.emitted('edit-contribution-link-data')).toBeTruthy()
    expect(wrapper.emitted('edit-contribution-link-data')[0]).toEqual([mockItems[0]])
  })

  it('shows modal when showContributionLink is called', async () => {
    const showMock = vi.fn()
    vi.mocked(useModal).mockReturnValue({ show: showMock })

    await wrapper.vm.showContributionLink(mockItems[0])
    expect(wrapper.vm.modalData).toEqual(mockItems[0])
    expect(showMock).toHaveBeenCalled()
  })

  describe('delete contribution link', () => {
    it('shows delete modal when handleDelete is called', async () => {
      const showMock = vi.fn()
      vi.mocked(useModal).mockReturnValue({ show: showMock })

      await wrapper.vm.handleDelete({ item: mockItems[0] })
      expect(wrapper.vm.itemToBeDeleted).toEqual(mockItems[0])
      expect(showMock).toHaveBeenCalled()
    })

    it('deletes contribution link and emits events on successful deletion', async () => {
      await wrapper.vm.executeDelete()

      expect(mockToastSuccess).toHaveBeenCalledWith('contributionLink.deleted')
      expect(wrapper.emitted('close-contribution-form')).toBeTruthy()
      expect(wrapper.emitted('get-contribution-links')).toBeTruthy()
    })

    it('shows error toast on deletion failure', async () => {
      const error = new Error('Deletion failed')
      vi.mocked(useMutation).mockReturnValue({
        mutate: vi.fn().mockRejectedValue(error),
      })

      await wrapper.vm.executeDelete()
      await nextTick()

      expect(mockToastError).toHaveBeenCalledWith('Deletion failed')
    })
  })
})
