import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionList from './ContributionList'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
})

vi.mock('@/components/Contributions/ContributionListItem.vue', () => ({
  default: {
    name: 'ContributionListItem',
    template: '<div></div>',
  },
}))

describe('ContributionList', () => {
  let wrapper

  const global = {
    plugins: [i18n],
    mocks: {
      $filters: {
        GDD: vi.fn((val) => val),
      },
    },
    stubs: {
      BPagination: true,
    },
  }

  const propsData = {
    contributionCount: 3,
    showPagination: true,
    pageSize: 25,
    items: [
      {
        id: 0,
        date: '07/06/2022',
        memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
        amount: '200',
        status: 'IN_PROGRESS',
      },
      {
        id: 1,
        date: '06/22/2022',
        memo: 'Ich habe 30 Stunden Frau Müller beim EInkaufen und im Haushalt geholfen.',
        amount: '600',
        status: 'CONFIRMED',
      },
      {
        id: 2,
        date: '05/04/2022',
        memo: 'Ich habe 50 Stunden den Nachbarkindern bei ihren Hausaufgaben geholfen und Nachhilfeunterricht gegeben.',
        amount: '1000',
        status: 'DENIED',
      },
    ],
  }

  const mountWrapper = () => {
    return mount(ContributionList, {
      props: propsData,
      global,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = mountWrapper()
    })

    it('has a DIV .contribution-list', () => {
      expect(wrapper.find('div.contribution-list').exists()).toBe(true)
    })

    describe('pagination', () => {
      describe('list count smaller than page size', () => {
        it('has no pagination buttons', () => {
          expect(wrapper.find('b-pagination-stub').exists()).toBe(false)
        })
      })

      describe('list count greater than page size', () => {
        beforeEach(async () => {
          await wrapper.setProps({ contributionCount: 33 })
        })

        it('has pagination buttons', () => {
          expect(wrapper.find('b-pagination-stub').exists()).toBe(true)
        })
      })

      describe('switch page', () => {
        const scrollToMock = vi.fn()
        window.scrollTo = scrollToMock

        beforeEach(async () => {
          await wrapper.setProps({ contributionCount: 33 })
          await wrapper.findComponent({ name: 'BPagination' }).vm.$emit('update:modelValue', 2)
        })

        it('emits update contribution list', () => {
          expect(wrapper.emitted('update-list-contributions')).toEqual([
            [{ currentPage: 2, pageSize: 25 }],
          ])
        })

        it('scrolls to top', () => {
          expect(scrollToMock).toHaveBeenCalledWith(0, 0)
        })
      })
    })

    describe('update contribution', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('update-contribution-form', 'item')
      })

      it('emits update contribution form', () => {
        expect(wrapper.emitted('update-contribution-form')).toEqual([['item']])
      })
    })

    describe('delete contribution', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('delete-contribution', { id: 2 })
      })

      it('emits delete contribution', () => {
        expect(wrapper.emitted('delete-contribution')).toEqual([[{ id: 2 }]])
      })
    })

    describe('update status', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('update-status', { id: 2 })
      })

      it('emits update status', () => {
        expect(wrapper.emitted('update-status')).toEqual([[{ id: 2 }]])
      })
    })
  })
})
