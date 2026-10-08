import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import NotFoundPage from './NotFoundPage.vue'
import { useI18n } from 'vue-i18n'

// Mock vue-i18n
vi.mock('vue-i18n')

const mockRouterGo = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ go: mockRouterGo }),
}))

describe('NotFoundPage', () => {
  let wrapper

  beforeEach(() => {
    // Mock the t function from useI18n
    const mockT = vi.fn((key) => key)
    useI18n.mockReturnValue({ t: mockT })

    wrapper = mount(NotFoundPage, {
      global: {
        mocks: {
          $t: mockT,
        },
      },
    })
  })

  it('renders an SVG', () => {
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders a back button', () => {
    expect(wrapper.find('.test-back').exists()).toBe(true)
  })

  it('goes one step back in the history on click', async () => {
    await wrapper.find('.test-back').trigger('click')
    expect(mockRouterGo).toHaveBeenCalledWith(-1)
  })
})
