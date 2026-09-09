// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import CardUserSearch from './CardUserSearch.vue'

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: { value: undefined },
    loading: { value: false },
    onResult: () => {},
    onError: () => {},
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })

const mountCard = (userLocation) =>
  mount(CardUserSearch, {
    global: {
      plugins: [createStore({ state: { gmsAllowed: true, userLocation }, mutations: {} }), i18n],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  })

let wrapper = null
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

/**
 * ⛔ The fifth reader of "does this member have a position?", and the last one still asking
 * it as `store.state.userLocation !== null` until 09.09.2026.
 *
 * The store is persisted whole, so the empty object the backend used to answer for an
 * account without a position is still sitting in the localStorage of every device that
 * signed in before the fix. `{} !== null` is true, so this card told exactly those members
 * they could be found and handed them the search button, while the find map -- reading the
 * same store key through the shared predicate -- turned them away.
 */
describe('CardUserSearch', () => {
  const allowed = () => de['card-user-search'].allowed.text.split('\n')[0]
  const notAllowed = () => de['card-user-search']['not-allowed'].text.split('\n')[0]

  beforeEach(() => {
    wrapper = null
  })

  it('offers the search to a member with a position', () => {
    const page = mountCard({ latitude: 48.2, longitude: 11.6 })

    expect(page.text()).toContain(allowed())
    expect(page.text()).not.toContain(notAllowed())
  })

  it.each([
    ['an empty object -- the answer that happened', {}],
    ['nothing at all', null],
    ['half a pair', { latitude: 48.2 }],
    ['a store that never carried the field', undefined],
  ])('asks a member without a position to set one first, for %s', (_name, userLocation) => {
    const page = mountCard(userLocation)

    expect(page.text()).toContain(notAllowed())
    expect(page.text()).not.toContain(allowed())
  })
})
