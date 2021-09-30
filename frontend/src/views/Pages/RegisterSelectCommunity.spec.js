import { mount } from '@vue/test-utils'
import RegisterSelectCommunity from './RegisterSelectCommunity'

const localVue = global.localVue

describe('RegisterSelectCommunity', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $store: {
      state: {
        community: {
          name: 'Gradido Entwicklung',
          url: 'http://localhost:3000/vue/',
          registerUrl: 'http://localhost:3000/vue/register',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
        },
      },
    },
  }

  const Wrapper = () => {
    return mount(RegisterSelectCommunity, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element "#register-select-community"', () => {
      expect(wrapper.find('div#register-select-community').exists()).toBeTruthy()
    })
  })
})
