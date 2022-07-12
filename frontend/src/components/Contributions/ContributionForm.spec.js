import { mount } from '@vue/test-utils'
import ContributionForm from './ContributionForm.vue'

const localVue = global.localVue

describe('ContributionForm', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return mount(ContributionForm, {
      localVue,
      mocks,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-form', () => {
      expect(wrapper.find('div.contribution-form').exists()).toBe(true)
    })
  })
})
