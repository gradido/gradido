import { mount } from '@vue/test-utils'
import Overview from './Overview'

const localVue = global.localVue

window.scrollTo = jest.fn()

describe('Overview', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn(),
  }

  const Wrapper = () => {
    return mount(Overview, {
      localVue,
      mocks,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a status gdd-status-gdd', () => {
      expect(wrapper.find('div.gdd-status-gdd').exists()).toBeTruthy()
    })
    it('has a status gdd-status-gdt', () => {
      expect(wrapper.find('div.gdd-status-gdt').exists()).toBeTruthy()
    })
    it('has a transactions table', () => {
      expect(wrapper.find('div.gdd-transaction-list').exists()).toBeTruthy()
    })

    describe('timestamp updates', () => {
      it('emits update transactions', async () => {
        expect(wrapper.emitted('update-transactions')).toHaveLength(1)
        await wrapper.setData({ timestamp: Date.now() })
        expect(wrapper.emitted('update-transactions')).toHaveLength(2)
      })
    })
  })
})
