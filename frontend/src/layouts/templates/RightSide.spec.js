import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RightSide from './RightSide'

vi.mock('bootstrap-vue-next', () => ({
  BContainer: {
    name: 'BContainer',
    template: '<div><slot></slot></div>',
  },
}))

describe('RightSide', () => {
  let wrapper

  const createWrapper = (routePath) => {
    return mount(RightSide, {
      global: {
        mocks: {
          $route: {
            path: routePath,
          },
        },
        stubs: {
          BContainer: true,
        },
      },
    })
  }

  describe('at /contributions/contribute', () => {
    beforeEach(() => {
      wrapper = createWrapper('/contributions/contribute')
    })

    it('has name set to "contributions"', () => {
      expect(wrapper.vm.name).toBe('contributions')
    })
  })

  describe('at /settings', () => {
    beforeEach(() => {
      wrapper = createWrapper('/settings')
    })

    it('has name set to "empty"', () => {
      expect(wrapper.vm.name).toBe('empty')
    })
  })

  describe('at /matching/entries', () => {
    beforeEach(() => {
      wrapper = createWrapper('/matching/entries')
    })

    it('has name set to "matching"', () => {
      expect(wrapper.vm.name).toBe('matching')
    })
  })

  describe('at /overview', () => {
    beforeEach(() => {
      wrapper = createWrapper('/overview')
    })

    it('has name set to "transactions"', () => {
      expect(wrapper.vm.name).toBe('transactions')
    })
  })

  /**
   * ⛔ The booking list stands beside the overview and nowhere else (Bernd, 27.08.2026).
   * The two code pages and the scanner are the reason it is a rule and not a tidy-up: they
   * are held out to another person, who was reading the last bookings next to the code.
   * The rest is repetition -- on /transactions the column repeated the page it stands
   * beside.
   */
  describe.each([
    ['/my-gradido-card'],
    ['/my-thank-you-card'],
    ['/scan'],
    ['/calculator'],
    ['/send'],
    ['/transactions'],
    ['/gdt'],
    ['/information'],
  ])('at %s', (path) => {
    beforeEach(() => {
      wrapper = createWrapper(path)
    })

    it('has name set to "empty"', () => {
      expect(wrapper.vm.name).toBe('empty')
    })
  })
})
