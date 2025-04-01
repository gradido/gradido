import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GddSend from './GddSend'

describe('GddSend', () => {
  let wrapper

  const mocks = {
    $t: vi.fn((t) => t),
    $i18n: {
      locale: vi.fn(() => 'en'),
    },
    $n: vi.fn((n) => String(n)),
  }

  const Wrapper = () => {
    return mount(GddSend, {
      global: {
        mocks,
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdd-send').exists()).toBe(true)
    })
  })
})
