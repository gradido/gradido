import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GddTransactionListFooter from './GddTransactionListFooter'
import { BListGroup, BListGroupItem } from 'bootstrap-vue-next'

describe('GddTransactionListFooter', () => {
  let wrapper

  const global = {
    mocks: {
      $t: vi.fn((t) => t),
    },
    stubs: {
      RouterLink: RouterLinkStub,
      BListGroup,
      BListGroupItem,
    },
  }

  const mountComponent = (props = {}) => {
    return mount(GddTransactionListFooter, {
      props,
      global,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = mountComponent()
    })

    it('renders the component', () => {
      expect(wrapper.find('div').exists()).toBe(true)
    })

    it('contains no text when count is not provided', () => {
      expect(wrapper.text()).toBe('')
    })
  })

  describe('count property is greater than 5', () => {
    beforeEach(() => {
      wrapper = mountComponent({ count: 6 })
    })

    it('renders a link to show all', () => {
      expect(wrapper.text()).toBe('transaction.show_all')
    })

    it('links to /transactions', () => {
      expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/transactions')
    })
  })
})
