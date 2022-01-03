import { mount } from '@vue/test-utils'
import PaginationButtons from './PaginationButtons'

const localVue = global.localVue

const propsData = {
  totalRows: 42,
  perPage: 12,
  value: 1,
}

describe('PaginationButtons', () => {
  let wrapper

  const Wrapper = () => {
    return mount(PaginationButtons, { localVue, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.pagination-buttons').exists()).toBeTruthy()
    })

    describe('with active buttons', () => {
      it('emits input next page button is clicked', async () => {
        wrapper.find('button.next-page').trigger('click')
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted().input[0]).toEqual([2])
      })

      it('emits input when previous page button is clicked', async () => {
        wrapper.setProps({ value: 2 })
        wrapper.setData({ currentValue: 2 })
        await wrapper.vm.$nextTick()
        wrapper.find('button.previous-page').trigger('click')
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted().input[0]).toEqual([1])
      })
    })
  })
})
