import { mount } from '@vue/test-utils'
import ContributionLink from './ContributionLink'

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

    it('has one contribution link in table', () => {
      expect(wrapper.find('div.contribution-link-list').find('tbody').findAll('tr')).toHaveLength(1)
    })

    it('has contribution form not visible by default', () => {
      expect(wrapper.find('#newContribution').isVisible()).toBe(false)
    })

    describe('click on create new contribution', () => {
      beforeEach(async () => {
        await wrapper.find('[data-test="new-contribution-link-button"]').trigger('click')
      })

      it('shows the contribution form', () => {
        expect(wrapper.find('#newContribution').isVisible()).toBe(true)
      })

      describe('click on create new contribution again', () => {
        beforeEach(async () => {
          await wrapper.find('[data-test="new-contribution-link-button"]').trigger('click')
        })

        it('closes the contribution form', () => {
          expect(wrapper.find('#newContribution').isVisible()).toBe(false)
        })
      })

      describe('click on close button', () => {
        beforeEach(async () => {
          await wrapper.find('button.btn-secondary').trigger('click')
        })

        it('closes the contribution form', () => {
          expect(wrapper.find('#newContribution').isVisible()).toBe(false)
        })
      })
    })

    describe('edit contribution link', () => {
      beforeEach(async () => {
        await wrapper
          .find('div.contribution-link-list')
          .find('tbody')
          .findAll('tr')
          .at(0)
          .findAll('button')
          .at(1)
          .trigger('click')
      })

      it('shows the contribution form', () => {
        expect(wrapper.find('#newContribution').isVisible()).toBe(true)
      })

      it('does not show the new contribution button', () => {
        expect(wrapper.find('[data-test="new-contribution-link-button"]').exists()).toBe(false)
      })

      describe('click on close button', () => {
        beforeEach(async () => {
          await wrapper.find('button.btn-secondary').trigger('click')
        })

        it('closes the contribution form', () => {
          expect(wrapper.find('#newContribution').isVisible()).toBe(false)
        })
      })
    })
  })
})
