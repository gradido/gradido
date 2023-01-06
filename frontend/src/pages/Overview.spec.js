import { mount } from '@vue/test-utils'
import Overview from './Overview'

const localVue = global.localVue

window.scrollTo = jest.fn()

describe('Overview', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn(),
    $i18n: {
      locale: 'en',
    },
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
  })
})
