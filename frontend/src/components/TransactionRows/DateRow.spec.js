import { mount } from '@vue/test-utils'
import DateRow from './DateRow'

const localVue = global.localVue

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
}

const propsData = {
  date: '02.02.2020',
}

describe('DateRow', () => {
  let wrapper

  const Wrapper = () => {
    return mount(DateRow, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.date-row').exists()).toBe(true)
    })

    it('shows the expiration text', () => {
      expect(wrapper.find('div.text-right').text()).toBe('form.date')
    })

    it('shows the date in long format', () => {
      expect(wrapper.find('div.gdd-transaction-list-item-date').text()).toBe(
        'Sun Feb 02 2020 00:00:00 GMT+0000 (Koordinierte Weltzeit)',
      )
    })
  })
})
