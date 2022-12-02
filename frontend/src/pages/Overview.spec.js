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

    it('has a community news element', () => {
      expect(wrapper.find('div.community-news').exists()).toBeTruthy()
    })

    /*
    describe('timestamp updates', () => {
      it('emits update transactions', async () => {
        expect(wrapper.emitted('update-transactions')).toHaveLength(1)
        await wrapper.setData({ timestamp: Date.now() })
        expect(wrapper.emitted('update-transactions')).toHaveLength(2)
      })
    })
    */
  })
})
