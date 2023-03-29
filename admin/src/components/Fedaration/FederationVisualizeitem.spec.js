import { mount } from '@vue/test-utils'
import FederationVisualizeItem from './FederationVisualizeItem.vue'

const localVue = global.localVue

const mocks = {
  $t: (key) => key,
  $i18n: {
    locale: 'de',
    t: (key) => key,
  },
}

describe('FederationVisualizeItem', () => {
  let wrapper

  const propsData = {
    item: {
      id: 7590,
      foreign: false,
      publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
      url: 'http://localhost/api/api/2_0',
      lastAnnouncedAt: null,
      verifiedAt: null,
      lastErrorAt: null,
      createdAt: '2023-03-29T04:46:38.823Z',
      updatedAt: null,
    },
  }

  const Wrapper = () => {
    return mount(FederationVisualizeItem, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.federation-visualize-item').exists()).toBe(true)
    })
  })
})
