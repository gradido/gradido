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

    describe('collapse open new Contribution', () => {
      beforeEach(() => {
        wrapper.vm.editContributionLinkData()
      })
      it('emits toggle::collapse new Contribution', () => {
        expect(wrapper.vm.$root.$emit('bv::toggle::collapse', 'newContribution')).toBeTruthy()
      })
      it('has collapse visible true', () => {
        expect(wrapper.vm.visible).toBe(true)
      })
    })

    describe('collapse close Contribution Form', () => {
      beforeEach(() => {
        wrapper.setData({ visible: true })
        wrapper.vm.closeContributionForm()
      })

      it('has collapse visible false', async () => {
        await wrapper.vm.$root.$emit('bv::toggle::collapse', 'newContribution')
        expect(wrapper.vm.visible).toBe(false)
      })

      it('has editContributionLink false', () => {
        expect(wrapper.vm.editContributionLink).toBe(false)
      })
    })
  })
})
