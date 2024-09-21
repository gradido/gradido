import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import RegisterCommunity from './RegisterCommunity.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { BButton, BCol, BContainer, BRow } from 'bootstrap-vue-next'

// Mock the CONFIG import
vi.mock('@/config', () => ({
  default: {
    COMMUNITY_NAME: 'Gradido Entwicklung',
    COMMUNITY_DESCRIPTION: 'Die lokale Entwicklungsumgebung von Gradido.',
    COMMUNITY_URL: 'http://localhost/',
  },
}))

describe('RegisterCommunity', () => {
  let wrapper
  let router
  let store

  const createVuexStore = () => {
    return createStore({
      state: {
        community: {
          name: '',
          description: '',
          url: '',
        },
      },
    })
  }

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/register', name: 'Register' },
        { path: '/select-community', name: 'SelectCommunity' },
        { path: '/login', name: 'Login' },
      ],
    })
    store = createVuexStore()

    wrapper = mount(RegisterCommunity, {
      global: {
        plugins: [router, store],
        stubs: {
          BRow,
          BCol,
          BContainer,
          BButton,
        },
        mocks: {
          $t: (key) => key,
        },
      },
    })
  })

  it('renders the Div Element "#register-community"', () => {
    expect(wrapper.find('div#register-community').exists()).toBe(true)
  })

  describe('Community data', () => {
    it('displays the community name', () => {
      expect(wrapper.find('.justify-content-center h1').text()).toBe('Gradido Entwicklung')
    })

    it('displays the community description', () => {
      expect(wrapper.find('.justify-content-center p.text-lead').text()).toBe(
        'Die lokale Entwicklungsumgebung von Gradido.',
      )
    })

    it('displays the community URL', () => {
      expect(wrapper.find('.community-location').text()).toBe('http://localhost/')
    })
  })

  describe('buttons and links', () => {
    it('has a button "Continue to registration"', () => {
      expect(wrapper.findAll('button').at(0).text()).toEqual('community.continue-to-registration')
    })

    it('button links to /register when clicking "Continue to registration"', () => {
      expect(wrapper.findAll('a').at(0).attributes('href')).toBe('/register')
    })

    it('has a button "Choose another community"', () => {
      expect(wrapper.findAll('button').at(1).text()).toEqual('community.choose-another-community')
    })

    it('button links to /select-community when clicking "Choose another community"', () => {
      expect(wrapper.findAll('a').at(1).attributes('href')).toBe('/select-community')
    })

    it('has a button "Back to Login"', () => {
      expect(wrapper.findAll('button').at(2).text()).toEqual('back')
    })

    it('button links to /login when clicking "Back to Login"', () => {
      expect(wrapper.findAll('a').at(2).attributes('href')).toBe('/login')
    })
  })
})
