import { mount } from '@vue/test-utils'
import { BButton, BCard, BCardText, BCollapse } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminStore } from '../../../test/adminStore'
import { ContributionLink } from './ContributionLink'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

const createAdminStore = (role = 'ADMIN') => adminStore({ moderator: { role } })

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

  const createWrapper = (role = 'ADMIN') => {
    return mount(ContributionLink, {
      props: {
        items: mockItems,
        count: 1,
      },
      global: {
        plugins: [createAdminStore(role)],
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

  const isFormVisible = () => wrapper.findComponent(BCollapse).props('modelValue')
  const form = () => wrapper.findComponent({ name: 'ContributionLinkForm' })
  const list = () => wrapper.findComponent({ name: 'ContributionLinkList' })

  it('has contribution form not visible by default', () => {
    expect(isFormVisible()).toBe(false)
  })

  describe('click on create new contribution', () => {
    beforeEach(async () => {
      await wrapper.find('[data-test="new-contribution-link-button"]').trigger('click')
    })

    it('shows the contribution form', () => {
      expect(isFormVisible()).toBe(true)
    })

    it('hides the form when clicked again', async () => {
      await wrapper.find('[data-test="new-contribution-link-button"]').trigger('click')
      expect(isFormVisible()).toBe(false)
    })

    // On a phone the card around the form keeps no side room of its own: two cards inside each
    // other left the form 220px of a 320px window (measured 23.10.2026). From 992px on the
    // card's 16px of before.
    it('the card around the form gives its sides to the form on a phone', () => {
      const body = wrapper.findComponent(BCollapse).find('.card-body')
      expect(body.classes()).toEqual(expect.arrayContaining(['px-0', 'px-lg-3']))
    })
  })

  describe('edit contribution link', () => {
    beforeEach(async () => {
      list().vm.$emit('edit-contribution-link-data', mockItems[0])
      await wrapper.vm.$nextTick()
    })

    it('shows the contribution form', () => {
      expect(isFormVisible()).toBe(true)
    })

    it('puts the form into edit mode', () => {
      expect(form().props('editContributionLink')).toBe(true)
    })

    it('hands the form the link to edit', () => {
      expect(form().props('contributionLinkData')).toEqual(mockItems[0])
    })

    it('hides new contribution button', () => {
      expect(wrapper.find('[data-test="new-contribution-link-button"]').exists()).toBe(false)
    })

    it('keeps the form open when the list asks to edit once more', async () => {
      list().vm.$emit('edit-contribution-link-data', mockItems[0])
      await wrapper.vm.$nextTick()
      expect(isFormVisible()).toBe(true)
    })
  })

  describe('close-contribution-form', () => {
    beforeEach(async () => {
      list().vm.$emit('edit-contribution-link-data', mockItems[0])
      await wrapper.vm.$nextTick()
      form().vm.$emit('close-contribution-form')
      await wrapper.vm.$nextTick()
    })

    it('hides the form', () => {
      expect(isFormVisible()).toBe(false)
    })

    it('takes the form out of edit mode', () => {
      expect(form().props('editContributionLink')).toBe(false)
    })

    it('empties the link the form edits', () => {
      expect(form().props('contributionLinkData')).toEqual({})
    })

    it('does the same when the list asks for it', async () => {
      list().vm.$emit('edit-contribution-link-data', mockItems[0])
      await wrapper.vm.$nextTick()
      list().vm.$emit('close-contribution-form')
      await wrapper.vm.$nextTick()
      expect(isFormVisible()).toBe(false)
      expect(form().props('editContributionLink')).toBe(false)
    })
  })

  describe('close-contribution-form while the form is closed', () => {
    it('leaves an edit in progress alone', async () => {
      // closing only resets what an open form shows
      list().vm.$emit('edit-contribution-link-data', mockItems[0])
      await wrapper.vm.$nextTick()
      wrapper.findComponent(BCollapse).vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()
      form().vm.$emit('close-contribution-form')
      await wrapper.vm.$nextTick()
      expect(form().props('editContributionLink')).toBe(true)
      expect(form().props('contributionLinkData')).toEqual(mockItems[0])
    })
  })

  it('passes on get-contribution-links from the form and from the list', async () => {
    form().vm.$emit('get-contribution-links')
    list().vm.$emit('get-contribution-links')
    expect(wrapper.emitted('get-contribution-links')).toHaveLength(2)
  })

  // Creating one is an administrator's job — offering the button to a moderator would only
  // produce a 401 from the backend.
  describe('as a moderator', () => {
    beforeEach(() => {
      wrapper = createWrapper('MODERATOR')
    })

    it('does not offer the new-contribution-link button', () => {
      expect(wrapper.find('[data-test="new-contribution-link-button"]').exists()).toBe(false)
    })
  })

  describe('as an administrator', () => {
    beforeEach(() => {
      wrapper = createWrapper('ADMIN')
    })

    it('offers the new-contribution-link button', () => {
      expect(wrapper.find('[data-test="new-contribution-link-button"]').exists()).toBe(true)
    })
  })
})
