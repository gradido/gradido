// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { NavContributions } from './NavContributions'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))

const mountAt = async (path, props) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  })
  await router.push(path)
  await router.isReady()
  return mount(NavContributions, { props, global: { plugins: [router] } })
}

// "Schöpfen" hands in its three routes by name, as before the tabs could be handed in.
const CONTRIBUTIONS = {
  contribute: 'contribute',
  ownContributions: 'own-contributions',
  allContributions: 'all-contributions',
  routeBase: '/contributions/',
}

describe('NavContributions', () => {
  describe('the three tabs of "Schöpfen"', () => {
    it('lead to the three routes, in this order, with their words', async () => {
      const links = (await mountAt('/contributions/contribute', CONTRIBUTIONS)).findAll('a')
      expect(links.map((link) => link.attributes('href'))).toEqual([
        '/contributions/contribute',
        '/contributions/own-contributions',
        '/contributions/all-contributions',
      ])
      expect(links.map((link) => link.text())).toEqual([
        'community.submitContribution',
        'community.myContributions',
        'community.community',
      ])
    })

    it('carry the pen as a picture and the two others as signs', async () => {
      const links = (await mountAt('/contributions/contribute', CONTRIBUTIONS)).findAll('a')
      expect(links[0].find('img').attributes('src')).toBe('/img/svg/write.svg')
      expect(links[1].find('svg').exists()).toBe(true)
      expect(links[2].find('svg').exists()).toBe(true)
    })

    it('mark the tab of the route it stands on', async () => {
      const links = (await mountAt('/contributions/own-contributions', CONTRIBUTIONS)).findAll('a')
      expect(links.map((link) => link.classes('router-link-active'))).toEqual([false, true, false])
    })
  })

  describe('the tabs another page hands in', () => {
    const TABS = [
      { route: 'write', label: 'Schreiben', icon: () => h('svg', { class: 'svg-icon write' }) },
      {
        route: 'my-requests',
        label: 'Meine Anfragen',
        icon: () => h('svg', { class: 'svg-icon' }),
      },
    ]

    it('lead to its routes, with the words and signs it hands in', async () => {
      const links = (
        await mountAt('/support/write', { routeBase: '/support/', tabs: TABS })
      ).findAll('a')
      expect(links.map((link) => link.attributes('href'))).toEqual([
        '/support/write',
        '/support/my-requests',
      ])
      expect(links.map((link) => link.text())).toEqual(['Schreiben', 'Meine Anfragen'])
      expect(links[0].find('svg.write').exists()).toBe(true)
    })

    it('mark the tab of the route it stands on', async () => {
      const links = (
        await mountAt('/support/my-requests', { routeBase: '/support/', tabs: TABS })
      ).findAll('a')
      expect(links.map((link) => link.classes('router-link-active'))).toEqual([false, true])
    })
  })
})
