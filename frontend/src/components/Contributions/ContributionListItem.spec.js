import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import ContributionListItem from './ContributionListItem'
import { BRow, BCol, BCollapse, BButton, BForm, BTextArea, BFormTextarea } from 'bootstrap-vue-next'
import VariantIcon from '@/components/VariantIcon.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      short: 'Short format date',
      contribution: {
        deleted: 'Deleted contribution',
        delete: 'Delete contribution',
        confirmed: 'Confirmed contribution',
      },
      form: {
        reply: 'Reply',
        memo: 'Memo',
      },
      edit: 'Edit',
      delete: 'Delete',
      Chat: 'Chat',
    },
  },
  datetimeFormats: {
    en: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    },
  },
})

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useLazyQuery: vi.fn(() => ({
    onResult: vi.fn(),
    onError: vi.fn(),
    load: vi.fn(),
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    addToast: vi.fn(),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  })),
}))

describe('ContributionListItem', () => {
  let wrapper

  const mocks = {
    $filters: {
      GDD: vi.fn((val) => val),
    },
    $t: vi.fn((key) => key),
    $d: (date, format) => date.toISOString(),
  }

  const propsData = {
    contributionId: 42,
    contributionStatus: 'PENDING',
    messagesCount: 2,
    id: 1,
    createdAt: '26/07/2022',
    contributionDate: '07/06/2022',
    memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
    amount: '200',
  }

  const mountWrapper = () => {
    return mount(ContributionListItem, {
      global: {
        plugins: [i18n],
        mocks,
        stubs: [
          'IBiPencil',
          'IBiTrash',
          'IBiChatDots',
          'BAvatar',
          'VariantIcon',
          'BButton',
          'IBiArrowDownCircle',
          'IBiArrowUpCircle',
          'IBiArrowUpShort',
          'ContributionMessagesListItem',
        ],
        components: {
          BRow,
          BCol,
          BCollapse,
          BButton,
          BForm,
          BTextArea,
          BFormTextarea,
        },
      },
      props: propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      wrapper = mountWrapper()
    })

    it('has a DIV .contribution-list-item', () => {
      expect(wrapper.find('div.contribution-list-item').exists()).toBe(true)
    })

    describe('contribution icon', () => {
      it('is bell-fill by default', () => {
        expect(wrapper.vm.icon).toBe('bell-fill')
      })

      it('is x-circle when contributionStatus is DELETED', async () => {
        await wrapper.setProps({ contributionStatus: 'DELETED' })
        expect(wrapper.vm.icon).toBe('trash')
      })

      it('is check when contributionStatus is CONFIRMED', async () => {
        await wrapper.setProps({ contributionStatus: 'CONFIRMED' })
        expect(wrapper.vm.icon).toBe('check')
      })
    })

    describe('contribution variant', () => {
      it('is primary by default', () => {
        expect(wrapper.vm.variant).toBe('primary')
      })

      it('is danger when contributionStatus is DELETED', async () => {
        await wrapper.setProps({ contributionStatus: 'DELETED' })
        expect(wrapper.vm.variant).toBe('danger')
      })

      it('is success at when contributionStatus is CONFIRMED', async () => {
        await wrapper.setProps({ contributionStatus: 'CONFIRMED' })
        expect(wrapper.vm.variant).toBe('success')
      })

      it('is warning at when contributionStatus is IN_PROGRESS', async () => {
        await wrapper.setProps({ contributionStatus: 'IN_PROGRESS' })
        expect(wrapper.vm.variant).toBe('205')
      })
    })

    describe('delete contribution', () => {
      describe('edit contribution', () => {
        beforeEach(() => {
          wrapper.find('div.test-edit-contribution').trigger('click')
        })

        it('emits update contribution form', () => {
          expect(wrapper.emitted('update-contribution-form')).toEqual([
            [
              {
                id: 1,
                contributionDate: '07/06/2022',
                memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
                amount: '200',
              },
            ],
          ])
        })
      })

      describe('confirm deletion', () => {
        beforeEach(() => {
          vi.spyOn(window, 'confirm').mockImplementation(() => true)
          wrapper.find('div.test-delete-contribution').trigger('click')
        })

        it('emits delete contribution', () => {
          expect(wrapper.emitted('contribution-changed')).toBeTruthy()
        })
      })

      describe('cancel deletion', () => {
        beforeEach(async () => {
          vi.spyOn(window, 'confirm').mockImplementation(() => false)
          await wrapper.find('div.test-delete-contribution').trigger('click')
        })

        it('does not emit delete contribution', () => {
          expect(wrapper.emitted('delete-contribution')).toBeFalsy()
        })
      })
    })

    describe('updateStatus', () => {
      it('updates status of a contribution', async () => {
        wrapper.vm.contributionStatus = 'IN_PROGRESS'

        wrapper.vm.addContributionMessage({})

        expect(wrapper.vm.localStatus).toBe('PENDING')
      })
    })
  })
})
