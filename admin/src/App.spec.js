import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { defaultLayout } from '@/layouts/defaultLayout'
import { adminStore } from '../test/adminStore'
import { App } from './App'

vi.mock('@/composables/useTheme', () => ({ useTheme: vi.fn() }))

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Mock Route</div>' } }],
})

const createAdminStore = (initialState = { token: null }) => {
  return adminStore(initialState)
}

describe('App', () => {
  let store
  let wrapper

  const createWrapper = (token = null) => {
    store = createAdminStore({ token })
    return shallowMount(App, {
      global: {
        plugins: [store, router],
        stubs: {
          BToastOrchestrator: true,
          BModalOrchestrator: true,
          defaultLayout: true,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('div#app is present', () => {
    expect(wrapper.find('div#app').exists()).toBe(true)
  })

  it('renders default layout when token is present', () => {
    wrapper = createWrapper('some-token')

    expect(wrapper.findComponent(defaultLayout).exists()).toBe(true)
    expect(wrapper.find('router-view-stub').exists()).toBe(false)
  })

  it('does not render defaultLayout when token is not present', () => {
    expect(wrapper.findComponent(defaultLayout).exists()).toBe(false)
    expect(wrapper.find('router-view-stub').exists()).toBe(true)
  })

  it('always renders BToastOrchestrator and BModalOrchestrator', () => {
    expect(wrapper.findComponent({ name: 'BToastOrchestrator' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'BModalOrchestrator' }).exists()).toBe(true)
  })

  // The wallet's light or dark, followed for as long as the app stands (composables/useTheme.ts).
  it('installs the theme on setup', () => {
    vi.mocked(useTheme).mockClear()
    createWrapper()
    expect(useTheme).toHaveBeenCalledTimes(1)
  })
})
