import { mount } from '@vue/test-utils'
import ContributionLink from './ContributionLink.vue'

const localVue = global.localVue

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
}

const propsData = {
  items: [
    {
      id: 1,
      name: 'Meditation',
      memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
      amount: '200',
      validFrom: '2022-04-01',
      validTo: '2022-08-01',
      cycle: 'täglich',
      maxPerCycle: '3',
      maxAmountPerMonth: 0,
      link: 'https://localhost/redeem/CL-1a2345678',
    },
  ],
  count: 1,
}

describe('ContributionLink', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ContributionLink, { localVue, mocks, propsData })
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

    it('emits toggle::collapse close Contribution-Form ', async () => {
      wrapper.vm.closeContributionForm()
      expect(wrapper.vm.$root.$emit('bv::toggle::collapse', 'newContribution')).toBeTruthy()
    })
  })
})
