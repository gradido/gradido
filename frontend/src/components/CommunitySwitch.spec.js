// AI-GENERATED — not an architecture reference
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import i18n from '@/i18n'
import CommunitySwitch from './CommunitySwitch.vue'

const toastError = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastError }) }))

const routing = vi.hoisted(() => ({ params: {} }))
vi.mock('vue-router', () => ({ useRoute: () => routing }))

// The list of communities, as the query hands it to whoever listens.
const HOME = { uuid: 'home-uuid', name: 'KI Playground', foreign: false }
const listening = vi.hoisted(() => ({ onResult: null }))
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    onResult: (listener) => {
      listening.onResult = listener
    },
  }),
}))

const mounted = (props = {}) => {
  const wrapper = mount(CommunitySwitch, {
    props: { modelValue: { uuid: '', name: 'KI Playground' }, ...props },
    global: {
      plugins: [i18n],
      stubs: { BDropdown: true, BDropdownItem: true, BRow: true, BCol: true },
    },
  })
  listening.onResult({ data: { reachableCommunities: [HOME] } })
  return wrapper
}

// A chat or a contact can lead to a community this one cannot reach at the moment: the admin
// interface lists it, the list of reachable communities does not.
describe('CommunitySwitch, a community the address names and the list does not have', () => {
  it('says so in the member’s language', () => {
    i18n.global.locale.value = 'de'
    routing.params = { communityIdentifier: 'away-uuid' }

    mounted()

    expect(toastError).toHaveBeenCalledWith(
      'Diese Gemeinschaft ist gerade nicht erreichbar. Bitte prüfe, welche Gemeinschaft gewählt ist.',
    )
  })

  it('goes on with the member’s own community', () => {
    routing.params = { communityIdentifier: 'away-uuid' }

    const wrapper = mounted()

    expect(wrapper.emitted('update:model-value').at(-1)).toEqual([HOME])
  })

  it('says nothing about a community the list has', () => {
    toastError.mockClear()
    routing.params = { communityIdentifier: 'home-uuid' }

    mounted()

    expect(toastError).not.toHaveBeenCalled()
  })
})
