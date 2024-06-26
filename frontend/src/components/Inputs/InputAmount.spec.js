import { mount } from '@vue/test-utils'
import InputAmount from './InputAmount'

const localVue = global.localVue

describe('InputAmount', () => {
  let wrapper
  let valid

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $route: {
      params: {},
    },
  }

  describe('mount in a TransactionForm', () => {
    const propsData = {
      name: '',
      label: '',
      placeholder: '',
      typ: 'TransactionForm',
      value: '12,34',
    }

    const Wrapper = () => {
      return mount(InputAmount, {
        localVue,
        mocks,
        propsData,
      })
    }

    beforeEach(() => {
      wrapper = Wrapper()
      wrapper.vm.$options.watch.value.call(wrapper.vm)
    })

    it('renders the component input-amount', () => {
      expect(wrapper.find('div.input-amount').exists()).toBe(true)
    })

    describe('amount normalization', () => {
      describe('if invalid', () => {
        beforeEach(async () => {
          await wrapper.setProps({ value: '12m34' })
          valid = false
        })

        it('is not normalized', () => {
          wrapper.vm.normalizeAmount(false)
          expect(wrapper.vm.currentValue).toBe('12m34')
        })
      })

      describe('if valid', () => {
        beforeEach(() => {
          valid = true
        })

        it('is normalized to a number - not rounded', async () => {
          wrapper.vm.normalizeAmount(valid)
          expect(wrapper.vm.currentValue).toBe('12.34')
        })
      })
    })
  })

  describe('mount in a ContributionForm', () => {
    const propsData = {
      name: '',
      label: '',
      placeholder: '',
      typ: 'ContributionForm',
      value: '12.34',
    }

    const Wrapper = () => {
      return mount(InputAmount, {
        localVue,
        mocks,
        propsData,
      })
    }

    beforeEach(() => {
      wrapper = Wrapper()
      wrapper.vm.$options.watch.value.call(wrapper.vm)
    })

    it('renders the component input-amount', () => {
      expect(wrapper.find('div.input-amount').exists()).toBe(true)
    })

    describe('amount normalization', () => {
      describe('if invalid', () => {
        beforeEach(async () => {
          await wrapper.setProps({ value: '12m34' })
          valid = false
        })

        it('is not normalized', () => {
          wrapper.vm.normalizeAmount(valid)
          expect(wrapper.vm.currentValue).toBe('12m34')
        })
      })

      describe('if valid', () => {
        beforeEach(() => {
          valid = true
        })

        it('is normalized to a ungroupedDecimal number', () => {
          wrapper.vm.normalizeAmount(valid)
          expect(wrapper.vm.currentValue).toBe('12.34')
        })
      })
    })
  })
})
