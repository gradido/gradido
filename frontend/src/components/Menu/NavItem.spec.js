// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { NavItem } from './NavItem'

const page = { template: '<div />' }

const mountOn = async (path, to) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: page },
      { path: '/register', component: page },
    ],
  })
  router.push(path)
  await router.isReady()
  return mount(NavItem, {
    props: { to },
    attrs: { class: 'from-parent' },
    slots: { default: 'Sign in' },
    global: { plugins: [router] },
  })
}

describe('NavItem', () => {
  // The page the visitor is on is no link: it is marked as the current one.
  it('marks the page the visitor is on, without a link', async () => {
    const wrapper = await mountOn('/login', '/login')
    const item = wrapper.find('li')

    expect(item.classes()).toEqual(['nav-item', 'active', 'from-parent'])
    const current = item.find('span.nav-link.active')
    expect(current.attributes('aria-current')).toBe('page')
    expect(current.text()).toBe('Sign in')
    expect(item.find('a').exists()).toBe(false)
  })

  it('links to another page through the router', async () => {
    const wrapper = await mountOn('/login', '/register')
    const item = wrapper.find('li')

    expect(item.classes()).toEqual(['nav-item', 'from-parent'])
    expect(item.find('span.nav-link').exists()).toBe(false)
    const link = item.find('a')
    expect(link.attributes('href')).toBe('/register')
    expect(link.text()).toBe('Sign in')
    // the inner item carries the class the auth bar's stylesheets style
    expect(item.find('.auth-navbar').exists()).toBe(true)
  })
})
