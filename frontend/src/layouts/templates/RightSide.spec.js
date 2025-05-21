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

  describe('at /overview', () => {
    beforeEach(() => {
      wrapper = createWrapper('/overview')
    })

    it('has name set to "transactions"', () => {
      expect(wrapper.vm.name).toBe('transactions')
    })
  })
})
