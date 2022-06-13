import { mount } from '@vue/test-utils'
import ContributionLinkForm from './ContributionLinkForm.vue'

const localVue = global.localVue

global.alert = jest.fn()

const propsData = {
  contributionLinkData: {},
}

const mocks = {
  $t: jest.fn((t) => t),
}

describe('ContributionLinkForm', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ContributionLinkForm, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".contribution-link-form"', () => {
      expect(wrapper.find('div.contribution-link-form').exists()).toBe(true)
    })

    it('function onReset', () => {
      beforeEach(() => {
        wrapper.setData({
          form: {
            name: 'name',
            memo: 'memo',
            amount: 100,
            startDate: 'startDate',
            endDate: 'endDate',
            cycle: 'cycle',
            repetition: 'repetition',
            maxAmount: 100,
          },
        })
        wrapper.vm.onReset()
      })
      expect(wrapper.vm.form).toEqual({
        amount: null,
        cycle: null,
        endDate: null,
        maxAmount: null,
        memo: null,
        name: null,
        repetition: null,
        startDate: null,
      })
    })

    it('onSubmit valid form', () => {
      wrapper.vm.onSubmit()
    })
  })
})
