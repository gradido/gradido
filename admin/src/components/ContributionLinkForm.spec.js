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

    describe('call onReset', () => {
      it('form has the set data', () => {
        beforeEach(() => {
          wrapper.setData({
            form: {
              name: 'name',
              memo: 'memo',
              amount: 100,
              validFrom: 'validFrom',
              validTo: 'validTo',
              cycle: 'ONCE',
              maxPerCycle: 1,
              maxAmountPerMonth: 100,
            },
          })
          wrapper.vm.onReset()
        })
        expect(wrapper.vm.form).toEqual({
          amount: null,
          cycle: 'ONCE',
          validTo: null,
          maxAmountPerMonth: '0',
          memo: null,
          name: null,
          maxPerCycle: 1,
          validFrom: null,
        })
      })
    })

    describe.skip('call onSubmit', () => {
      it('response with the contribution link url', () => {
        wrapper.vm.onSubmit()
      })
    })
  })
})
