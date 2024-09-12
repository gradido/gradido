import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionLinkList from './ContributionLinkList.vue'
import { BButton, BCard, BCardText, BModal, BTable } from 'bootstrap-vue-next'
import * as apolloComposable from '@vue/apollo-composable'

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key) => key,
    d: (date) => date.toISOString(),
  })),
}))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

// Mock useAppToast
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

describe('ContributionLinkList', () => {
  let wrapper
  let mutateMock

  const createWrapper = () => {
    return mount(ContributionLinkList, {
      props: {
        items: [
          {
            id: 1,
            name: 'Meditation',
            memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
            amount: '200',
            validFrom: '2022-04-01',
            validTo: '2022-08-01',
            cycle: 'täglich',
            maxPerCycle: '3',
            maxAmountPerMonth: 0,
            link: 'https://localhost/redeem/CL-1a2345678',
          },
        ],
      },
      global: {
        components: {
          BTable,
          BButton,
          BModal,
          BCard,
          BCardText,
        },
        stubs: {
          IBiTrash: true,
          IBiPencil: true,
          IBiEye: true,
          FigureQrCode: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mutateMock = vi.fn()
    vi.spyOn(apolloComposable, 'useMutation').mockReturnValue({ mutate: mutateMock })
    wrapper = createWrapper()
  })

  it('renders the Div Element ".contribution-link-list"', () => {
    expect(wrapper.find('div.contribution-link-list').exists()).toBe(true)
  })

  it('renders table with contribution link', () => {
    expect(wrapper.findComponent({ name: 'BTable' }).exists()).toBe(true)
  })

  describe('edit contribution link', () => {
    it('emits editContributionLinkData', async () => {
      await wrapper.vm.editContributionLink({ id: 1 })
      expect(wrapper.emitted('edit-contribution-link-data')).toBeTruthy()
    })
  })

  describe('delete contribution link', () => {
    describe('with success', () => {
      beforeEach(async () => {
        mutateMock.mockResolvedValue({})
        await wrapper.vm.handleDelete({ item: { id: 1, name: 'Test' } })
        await wrapper.vm.executeDelete()
      })

      it('calls the mutation and emits events', async () => {
        expect(mutateMock).toHaveBeenCalledWith({ id: 1 })
        expect(wrapper.emitted('close-contribution-form')).toBeTruthy()
        expect(wrapper.emitted('get-contribution-links')).toBeTruthy()
      })

      it('toasts a success message', () => {
        expect(mockToastSuccess).toHaveBeenCalledWith('contributionLink.deleted')
      })
    })

    describe('with error', () => {
      beforeEach(async () => {
        mutateMock.mockRejectedValue(new Error('Something went wrong :('))
        await wrapper.vm.handleDelete({ item: { id: 1, name: 'Test' } })
        await wrapper.vm.executeDelete()
      })

      it('toasts an error message', () => {
        expect(mockToastError).toHaveBeenCalledWith('Something went wrong :(')
      })
    })
  })
})
