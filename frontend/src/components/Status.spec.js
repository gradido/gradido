import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Status from './Status'

describe('Status', () => {
  let wrapper

  const mocks = {
    $t: vi.fn((t) => t),
    $n: vi.fn((n) => n),
  }

  const propsData = {
    balance: 1234,
    statusText: 'GDD',
  }

  const createWrapper = () => {
    return mount(Status, {
      global: {
        mocks,
      },
      props: propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    describe('balance is pending', () => {
      it('displays an animation icon test-pending-icon', () => {
        expect(wrapper.find('.test-pending-icon').exists()).toBe(true)
      })
    })

    describe('balance is loaded', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          pending: false,
        })
      })

      it('does not display an animation icon test-pending-icon', () => {
        expect(wrapper.find('.test-pending-icon').exists()).toBe(false)
      })

      it('displays the amount of GDD', () => {
        expect(wrapper.find('div.gdd-status-div').text()).toEqual('1234 GDD')
      })
    })
  })
})
