import { shallowMount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App'
import DashboardLayout from '@/layouts/DashboardLayout'
import AuthLayout from '@/layouts/AuthLayout'

// Mock the store
const createMockStore = (state = {}) => ({
  state: {
    darkMode: false,
    ...state,
  },
})

// Mock the route
const createMockRoute = (meta = {}) => ({
  meta: {
    requiresAuth: false,
    ...meta,
  },
  params: {},
})

describe('App', () => {
  let wrapper

  const createWrapper = (options = {}) => {
    return shallowMount(App, {
      global: {
        mocks: {
          $store: createMockStore(options.state),
          $route: createMockRoute(options.routeMeta),
        },
        stubs: {
          BToastOrchestrator: true,
          DashboardLayout: true,
          AuthLayout: true,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the App', () => {
    expect(wrapper.find('#app').exists()).toBe(true)
  })

  it('renders AuthLayout when route does not require auth', () => {
    expect(wrapper.findComponent(AuthLayout).exists()).toBe(true)
    expect(wrapper.findComponent(DashboardLayout).exists()).toBe(false)
  })

  it('renders DashboardLayout when route requires auth', () => {
    wrapper = createWrapper({
      routeMeta: { requiresAuth: true },
    })

    expect(wrapper.findComponent(DashboardLayout).exists()).toBe(true)
    expect(wrapper.findComponent(AuthLayout).exists()).toBe(false)
  })

  it('applies dark mode class when darkMode is true', () => {
    wrapper = createWrapper({
      state: { darkMode: true },
    })

    expect(wrapper.classes()).toContain('dark-mode')
  })

  it('does not apply dark mode class when darkMode is false', () => {
    expect(wrapper.classes('dark-mode')).toBe(false)
  })
})
