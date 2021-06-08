import { mount } from '@vue/test-utils'
import PaginationButtons from './PaginationButtons'

const localVue = global.localVue

describe('PaginationButtons', () => {
  let wrapper

  const Wrapper = () => {
    return mount(PaginationButtons, { localVue })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.pagination-buttons').exists()).toBeTruthy()
    })

    it('has previous page button disabled by default', () => {
      expect(wrapper.find('button.previous-page').attributes('disabled')).toBe('disabled')
    })

    it('has bext page button disabled by default', () => {
      expect(wrapper.find('button.next-page').attributes('disabled')).toBe('disabled')
    })

    it('shows the text "1 / 1" by default"', () => {
      expect(wrapper.find('p.text-center').text()).toBe('1 / 1')
    })

    describe('with active buttons', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          hasNext: true,
          hasPrevious: true,
        })
      })

      it('emits show-previous when previous page button is clicked', () => {
        wrapper.find('button.previous-page').trigger('click')
        expect(wrapper.emitted('show-previous')).toBeTruthy()
      })

      it('emits show-next when next page button is clicked', () => {
        wrapper.find('button.next-page').trigger('click')
        expect(wrapper.emitted('show-next')).toBeTruthy()
      })
    })
  })
})
