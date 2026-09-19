// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import ShowFriendsTile from './ShowFriendsTile.vue'
import en from '@/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

// The real route path, so the link is resolved by a router rather than read off a prop.
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/show-friends', component: { template: '<div />' } }],
})

const mountTile = () =>
  mount(ShowFriendsTile, {
    global: { plugins: [i18n, router], stubs: { IMdiChevronRight: true } },
  })

describe('ShowFriendsTile', () => {
  it('says what it is about', () => {
    const wrapper = mountTile()

    expect(wrapper.text()).toContain(en.showFriends.tile.title)
    expect(wrapper.text()).toContain(en.showFriends.tile.text)
  })

  // The tile is the only way onto the page -- there is no menu entry.
  it('leads to the page for showing Gradido to somebody', () => {
    const go = mountTile().find('[data-test="show-friends-tile-go"]')

    expect(go.attributes('href')).toBe('/show-friends')
    expect(go.text()).toBe(en.showFriends.tile.go)
  })
})
