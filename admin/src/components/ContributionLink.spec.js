import { mount } from '@vue/test-utils'
import ContributionLink from './ContributionLink.vue'

const localVue = global.localVue

const mocks = {
  $t: jest.fn((t) => t),
}

describe('ContributionLink', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ContributionLink, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".contribution-link"', () => {
      expect(wrapper.find('div.contribution-link').exists()).toBe(true)
    })

    it('emits toggle::collapse new Contribution', async () => {
      wrapper.vm.editContributionLinkData()
      expect(wrapper.vm.$root.$emit('bv::toggle::collapse', 'newContribution')).toBeTruthy()
    })
  })
})
