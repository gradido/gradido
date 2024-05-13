import { RouterLinkStub, mount } from '@vue/test-utils'
import Overview from './Overview'
import VueRouter from 'vue-router'

const localVue = global.localVue
localVue.use(VueRouter)

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
      stubs: {
        RouterLink: RouterLinkStub,
      },
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
