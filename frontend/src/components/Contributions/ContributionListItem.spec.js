import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionListItem from './ContributionListItem'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
})

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useLazyQuery: vi.fn(() => ({
    onResult: vi.fn(),
    onError: vi.fn(),
    load: vi.fn(),
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
  })),
}))

describe('ContributionListItem', () => {
  let wrapper

  const mocks = {
    $filters: {
      GDD: vi.fn((val) => val),
    },
  }

  const propsData = {
    contributionId: 42,
    status: 'PENDING',
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

      it('is x-circle when deletedAt is present', async () => {
        await wrapper.setProps({ deletedAt: new Date().toISOString() })
        expect(wrapper.vm.icon).toBe('trash')
      })

      it('is check when confirmedAt is present', async () => {
        await wrapper.setProps({ confirmedAt: new Date().toISOString() })
        expect(wrapper.vm.icon).toBe('check')
      })
    })

    describe('contribution variant', () => {
      it('is primary by default', () => {
        expect(wrapper.vm.variant).toBe('primary')
      })

      it('is danger when deletedAt is present', async () => {
        await wrapper.setProps({ deletedAt: new Date().toISOString() })
        expect(wrapper.vm.variant).toBe('danger')
      })

      it('is success at when confirmedAt is present', async () => {
        await wrapper.setProps({ confirmedAt: new Date().toISOString() })
        expect(wrapper.vm.variant).toBe('success')
      })

      it('is warning at when status is IN_PROGRESS', async () => {
        await wrapper.setProps({ status: 'IN_PROGRESS' })
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
          expect(wrapper.emitted('delete-contribution')).toEqual([[{ id: 1 }]])
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

      describe('updateStatus', () => {
        beforeEach(async () => {
          await wrapper.vm.updateStatus()
        })

        it('emit update-status', () => {
          expect(wrapper.emitted('update-status')).toBeTruthy()
        })
      })
    })

    describe('getListContributionMessages', () => {
      beforeEach(() => {
        wrapper
          .findComponent({ name: 'ContributionMessagesList' })
          .vm.$emit('get-list-contribution-messages')
      })
      it('emits close-all-open-collapse', () => {
        expect(wrapper.emitted('close-all-open-collapse')).toBeTruthy()
      })
    })
  })
})
