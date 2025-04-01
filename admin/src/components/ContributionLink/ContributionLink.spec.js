import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import ContributionLink from './ContributionLink.vue'
import { BButton, BCard, BCardText, BCollapse } from 'bootstrap-vue-next'

const mockItems = [
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
]

describe('ContributionLink', () => {
  let wrapper

  const createWrapper = () => {
    return mount(ContributionLink, {
      props: {
        items: mockItems,
        count: 1,
      },
      global: {
        mocks: {
          $t: (key) => key,
          $d: (d) => d,
        },
        stubs: {
          BCard,
          BButton,
          BCollapse,
          BCardText,
          ContributionLinkForm: true,
          ContributionLinkList: true,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the Div Element ".contribution-link"', () => {
    expect(wrapper.find('div.contribution-link').exists()).toBe(true)
  })

  it('has ContributionLinkList component when count > 0', () => {
    expect(wrapper.findComponent({ name: 'ContributionLinkList' }).exists()).toBe(true)
  })

  it('shows "no contribution links" message when count is 0', async () => {
    await wrapper.setProps({ count: 0 })
    expect(wrapper.text()).toContain('contributionLink.noContributionLinks')
  })

  it('has contribution form not visible by default', () => {
    expect(wrapper.vm.visible).toBe(false)
  })

  describe('click on create new contribution', () => {
    beforeEach(async () => {
      await wrapper.find('[data-test="new-contribution-link-button"]').trigger('click')
    })

    it('shows the contribution form', () => {
      expect(wrapper.vm.visible).toBe(true)
    })

    it('hides the form when clicked again', async () => {
      await wrapper.find('[data-test="new-contribution-link-button"]').trigger('click')
      expect(wrapper.vm.visible).toBe(false)
    })
  })

  describe('edit contribution link', () => {
    beforeEach(async () => {
      wrapper.vm.editContributionLinkData(mockItems[0])
    })

    it('shows the contribution form', () => {
      expect(wrapper.vm.visible).toBe(true)
    })

    it('sets editContributionLink to true', () => {
      expect(wrapper.vm.editContributionLink).toBe(true)
    })

    it('sets contributionLinkData', () => {
      expect(wrapper.vm.contributionLinkData).toEqual(mockItems[0])
    })

    it('hides new contribution button', () => {
      expect(wrapper.find('[data-test="new-contribution-link-button"]').exists()).toBe(false)
    })
  })

  describe('closeContributionForm', () => {
    beforeEach(() => {
      wrapper.vm.visible = true
      wrapper.vm.editContributionLink = true
      wrapper.vm.contributionLinkData = mockItems[0]
      wrapper.vm.closeContributionForm()
    })

    it('hides the form', () => {
      expect(wrapper.vm.visible).toBe(false)
    })

    it('resets editContributionLink', () => {
      expect(wrapper.vm.editContributionLink).toBe(false)
    })

    it('resets contributionLinkData', () => {
      expect(wrapper.vm.contributionLinkData).toEqual({})
    })
  })
})
