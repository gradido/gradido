import { mount } from '@vue/test-utils'
import NotFoundPage from './NotFoundPage'

const localVue = global.localVue

describe('NotFoundPage', () => {
  let wrapper

  const Wrapper = () => {
    return mount(NotFoundPage, { localVue })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a svg', () => {
      expect(wrapper.find('svg').exists()).toBeTruthy()
    })
  })
})
