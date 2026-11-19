// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { walletStore } from '@test/walletStore'
import { ContributionInfo } from '@/components/Template/RightSide/ContributionInfo'
import { SupportTemplate } from './SupportTemplate'

// The column beside "Support": one text per tab. Here the tab "Information" and the switch of
// new requests (K5); the words themselves are in the language files.
// The column is TSX now and takes its words from useI18n, not from `$t`.
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal()),
  useI18n: () => ({ t: (key) => key }),
}))

// ContributionInfo picks its slot by the route's tab and asks `useRoute()` for it.
const route = { params: {} }
vi.mock('vue-router', () => ({ useRoute: () => route }))

const mountOn = (tab, state = {}) => {
  route.params = { tab }
  return mount(SupportTemplate, {
    global: {
      plugins: [walletStore(state)],
      components: { ContributionInfo },
      mocks: { $t: (key) => key, $route: { params: { tab } } },
      stubs: { 'variant-icon': true },
    },
  })
}

describe('SupportTemplate', () => {
  it.each([
    [null, 'not known yet'],
    [true, 'on'],
  ])('says under "Information" where to ask while new requests are %s (%s)', (active) => {
    const text = mountOn('information', { supportTicketsActive: active }).text()
    expect(text).toContain('support.info.information')
    expect(text).not.toContain('support.info.informationOff')
  })

  // without the way to "Schreiben", which shows the support's address then
  it('leaves the way to "Schreiben" out while new requests are switched off', () => {
    const text = mountOn('information', { supportTicketsActive: false }).text()
    expect(text).toContain('support.info.informationOff')
    expect(text.replace('support.info.informationOff', '')).not.toContain(
      'support.info.information',
    )
  })

  it('names the four states under "Meine Anfragen", whatever the switch says', () => {
    for (const active of [null, true, false]) {
      const text = mountOn('my-requests', { supportTicketsActive: active }).text()
      for (const state of ['open', 'inProgress', 'closed', 'deleted']) {
        expect(text).toContain(`support.legend.${state}`)
      }
    }
  })
})
