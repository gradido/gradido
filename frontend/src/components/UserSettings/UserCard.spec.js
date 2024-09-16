import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UserCard from './UserCard.vue'
import { BCol, BRow } from 'bootstrap-vue-next'

vi.mock('vue-avatar', () => ({
  default: {
    name: 'Avatar',
    template: '<span class="vue-avatar--wrapper"><span>{{ initials }}</span></span>',
    props: ['username', 'initials', 'color', 'size'],
  },
}))

vi.mock('@/config', () => ({
  default: {
    COMMUNITY_NAME: 'Test Community',
  },
}))

describe('UserCard', () => {
  let wrapper

  const mockStore = {
    state: {
      firstName: 'Bibi',
      lastName: 'Bloxberg',
    },
  }

  const mocks = {
    $t: vi.fn((t) => t),
    $n: vi.fn((n) => String(n)),
    $store: mockStore,
  }

  beforeEach(() => {
    wrapper = mount(UserCard, {
      global: {
        components: {
          BRow,
          BCol,
        },
        mocks,
      },
      props: {
        balance: 100,
        transactionCount: 5,
      },
    })
  })

  it('renders the Div Element ".userdata-card"', () => {
    expect(wrapper.find('.userdata-card').exists()).toBe(true)
  })

  it('renders the SPAN Element ".vue-avatar--wrapper"', () => {
    expect(wrapper.find('.vue-avatar--wrapper').exists()).toBe(true)
  })

  it('displays the first letters of the firstName and lastName', () => {
    expect(wrapper.find('.vue-avatar--wrapper span').text()).toBe('BB')
  })

  it('displays the correct balance', () => {
    expect(wrapper.text()).toContain('100')
    expect(mocks.$n).toHaveBeenCalledWith(100, 'decimal')
  })

  it('displays the correct transaction count', () => {
    expect(wrapper.text()).toContain('5')
  })

  it('displays the community name', () => {
    expect(wrapper.text()).toContain('Test Community')
  })

  it('displays the correct translations', () => {
    expect(wrapper.text()).toContain('GDD')
    expect(wrapper.text()).toContain('navigation.transactions')
    expect(wrapper.text()).toContain('community.community')
  })

  it('computes the correct username', () => {
    expect(wrapper.vm.username.username).toBe('Bibi Bloxberg')
    expect(wrapper.vm.username.initials).toBe('BB')
  })
})
