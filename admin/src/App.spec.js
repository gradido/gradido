import { describe, it, expect, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import defaultLayout from '@/layouts/defaultLayout'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Mock Route</div>' } }],
})

const createVuexStore = (initialState = { token: null }) => {
  return createStore({
    state() {
      return initialState
    },
  })
}

describe('App.vue', () => {
  let store
  let wrapper

  const createWrapper = (token = null) => {
    store = createVuexStore({ token })
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
})
