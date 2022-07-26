import { mount } from '@vue/test-utils'
import ContributionForm from './ContributionForm.vue'

const localVue = global.localVue

describe('ContributionForm', () => {
  let wrapper

  const propsData = {
    value: {
      id: null,
      date: '',
      memo: '',
      amount: '',
    },
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $store: {
      state: {
        creation: ['1000', '1000', '1000'],
      },
    },
    $i18n: {
      locale: 'en',
    },
  }

  const Wrapper = () => {
    return mount(ContributionForm, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-form', () => {
      expect(wrapper.find('div.contribution-form').exists()).toBe(true)
    })

    it('is submit button disable of true', () => {
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
    })
  })
})
