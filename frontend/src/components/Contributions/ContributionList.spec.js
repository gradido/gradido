import { mount } from '@vue/test-utils'
import ContributionList from './ContributionList.vue'

const localVue = global.localVue

describe('ContributionList', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
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
      },
      {
        id: 1,
        date: '06/22/2022',
        memo: 'Ich habe 30 Stunden Frau Müller beim EInkaufen und im Haushalt geholfen.',
        amount: '600',
      },
      {
        id: 2,
        date: '05/04/2022',
        memo: 'Ich habe 50 Stunden den Nachbarkindern bei ihren Hausaufgaben geholfen und Nachhilfeunterricht gegeben.',
        amount: '1000',
      },
    ],
  }

  const Wrapper = () => {
    return mount(ContributionList, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-list', () => {
      expect(wrapper.find('div.contribution-list').exists()).toBe(true)
    })

    describe('pagination', () => {
      describe('list count smaller than page size', () => {
        it('has no pagination buttons', () => {
          expect(wrapper.find('ul.pagination').exists()).toBe(false)
        })
      })

      describe('list count greater than page size', () => {
        beforeEach(() => {
          wrapper.setProps({ contributionCount: 33 })
        })

        it('has pagination buttons', () => {
          expect(wrapper.find('ul.pagination').exists()).toBe(true)
        })
      })

      describe('switch page', () => {
        const scrollToMock = jest.fn()
        window.scrollTo = scrollToMock

        beforeEach(async () => {
          await wrapper.setProps({ contributionCount: 33 })
          wrapper.findComponent({ name: 'BPagination' }).vm.$emit('input', 2)
        })

        it('emits update contribution list', () => {
          expect(wrapper.emitted('update-list-contributions')).toEqual([
            [{ currentPage: 2, pageSize: 25 }],
          ])
        })

        it('scrolls to top', () => {
          expect(scrollToMock).toBeCalledWith(0, 0)
        })
      })
    })

    describe('update contribution', () => {
      beforeEach(() => {
        wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('update-contribution-form', 'item')
      })

      it('emits update contribution form', () => {
        expect(wrapper.emitted('update-contribution-form')).toEqual([['item']])
      })
    })

    describe('delete contribution', () => {
      beforeEach(() => {
        wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('delete-contribution', { id: 2 })
      })

      it('emits delete contribution', () => {
        expect(wrapper.emitted('delete-contribution')).toEqual([[{ id: 2 }]])
      })
    })
  })
})
