import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import OpenCreationsAmount from './OpenCreationsAmount'
import { BCol, BRow } from 'bootstrap-vue-next'

const mockT = vi.fn((key) => key)
const mockD = vi.fn((date, formatter = null) => ({ date, formatter }))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
    d: mockD,
  }),
}))

describe('OpenCreationsAmount', () => {
  let wrapper

  const thisMonth = new Date()
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1)

  const createWrapper = (props = {}) => {
    return mount(OpenCreationsAmount, {
      global: {
        components: {
          BRow,
          BCol,
        },
        mocks: {
          $t: mockT,
          $d: mockD,
        },
      },
      props: {
        minimalDate: lastMonth,
        maxGddLastMonth: 400,
        maxGddThisMonth: 600,
        ...props,
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.app-box-shadow').exists()).toBe(true)
    })

    it('renders two dates', () => {
      expect(mockD).toHaveBeenCalledTimes(2)
    })

    it('renders the date of last month', () => {
      expect(mockD).toHaveBeenCalledWith(lastMonth, 'monthAndYear')
    })

    it('renders the date of this month', () => {
      expect(mockD).toHaveBeenCalledWith(expect.any(Date), 'monthAndYear')
    })

    describe('open creations for both months', () => {
      it('renders submitted contributions text', () => {
        const statusElements = wrapper.findAll('.fw-bold .d-none.d-md-inline:not(.text-gold)')
        expect(statusElements.at(0).text()).toBe('contribution.submit')
        expect(statusElements.at(1).text()).toBe('contribution.submit')
      })

      it('does not render max reached text', () => {
        expect(wrapper.text()).not.toContain('maxReached')
      })

      it('renders submitted hours last month', () => {
        const submittedHours = wrapper.findAll('.fw-bold .text-gold').at(0)
        expect(submittedHours.text()).toBe('30 h')
      })

      it('renders available hours last month', () => {
        const availableHours = wrapper.findAll('.fw-bold .text-green').at(0)
        expect(availableHours.text()).toBe('20 h')
      })

      it('renders submitted hours this month', () => {
        const submittedHours = wrapper.findAll('.fw-bold .text-gold').at(1)
        expect(submittedHours.text()).toBe('20 h')
      })

      it('renders available hours this month', () => {
        const availableHours = wrapper.findAll('.fw-bold .text-green').at(1)
        expect(availableHours.text()).toBe('30 h')
      })
    })

    describe('no creations available for last month', () => {
      beforeEach(() => {
        wrapper = createWrapper({ maxGddLastMonth: 0 })
      })

      it('renders submitted contributions text for this month', () => {
        const statusElements = wrapper.findAll('.fw-bold .d-none.d-md-inline:not(.text-gold)')
        expect(statusElements.at(1).text()).toBe('contribution.submit')
      })

      it('renders max reached text for last month', () => {
        const statusElements = wrapper.findAll('.fw-bold .d-none.d-md-inline')
        expect(statusElements.at(0).text()).toBe('maxReached')
      })

      it('renders submitted hours last month', () => {
        const submittedHours = wrapper.findAll('.fw-bold .text-gold').at(0)
        expect(submittedHours.text()).toBe('50 h')
      })

      it('renders available hours last month', () => {
        const availableHours = wrapper.findAll('.fw-bold .text-green').at(0)
        expect(availableHours.text()).toBe('0 h')
      })
    })
  })
})
