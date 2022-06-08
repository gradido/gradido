import { mount } from '@vue/test-utils'
import ContributionLinkForm from './ContributionLinkForm.vue'

const localVue = global.localVue

const propsData = {
  contributionLinkData: {},
}
jest.spyOn(window, 'alert').mockReturnValue()

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
      expect(wrapper.find('div.contribution-link-form').exists()).toBeTruthy()
    })

    it('function onSubmit', () => {
      wrapper.vm.onSubmit()
    })

    it('function onReset', () => {
      wrapper.vm.onReset()
    })

    it('function updateForm', () => {
      wrapper.vm.updateForm()
    })
  })
})
