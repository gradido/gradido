// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import FavoriteHeart from './FavoriteHeart.vue'
import { forgetFavorites, isFavorite, rememberFavorites } from '@/composables/useFavorites'

const mutateAdd = vi.fn().mockResolvedValue({ data: { addFavorite: true } })
const mutateRemove = vi.fn().mockResolvedValue({ data: { removeFavorite: true } })
const toastError = vi.fn()

vi.mock('@/graphql/contacts.graphql', () => ({
  addFavorite: 'addFavorite',
  removeFavorite: 'removeFavorite',
}))
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => ({ mutate: document === 'addFavorite' ? mutateAdd : mutateRemove }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError }),
}))

// The component imports BButton and BModal itself, so a stub by name in `mount` never
// reaches them -- the module is replaced instead (the AliasFirstChoice spec does the same).
// ⛔ `emits` is not decoration: without it the parent's `@click` becomes a fallthrough
// attribute AND the template's own `$emit` fires it, so one click runs the handler twice.
vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot /></button>',
  },
  // The dialog: rendered only while open, its "remove" answer as a button.
  BModal: {
    props: ['modelValue'],
    emits: ['ok', 'update:modelValue'],
    template:
      '<div v-if="modelValue"><slot /><button data-test="dialog-ok" @click="$emit(`ok`)" /></div>',
  },
}))

const CARLA = { communityUuid: 'home', gradidoID: 'carla', alias: 'Carla-Sonne' }

const globalOptions = {
  mocks: { $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) },
  stubs: {
    IMdiHeart: { template: '<i data-test="heart-full" />' },
    IMdiHeartOutline: { template: '<i data-test="heart-empty" />' },
  },
}

describe('FavoriteHeart', () => {
  let wrapper

  const mountWith = (props = {}) => {
    wrapper = mount(FavoriteHeart, {
      props: { member: CARLA, ...props },
      global: globalOptions,
    })
    return wrapper
  }

  const button = () => wrapper.find('[data-test="favorite-heart"]')
  // The component's own data-test falls through onto the stub's root and wins over the
  // stub's -- so the dialog is found by the component's name for it.
  const dialog = () => wrapper.find('[data-test="favorite-remove-dialog"]')

  beforeEach(() => {
    forgetFavorites()
    mutateAdd.mockClear()
    mutateRemove.mockClear()
    toastError.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('shows an empty heart for a contact who is not a favourite', () => {
    mountWith()
    expect(wrapper.find('[data-test="heart-empty"]').exists()).toBe(true)
    expect(button().attributes('aria-pressed')).toBe('false')
    expect(button().attributes('aria-label')).toBe('contacts.heart.add')
  })

  it('shows a full heart for a favourite', () => {
    rememberFavorites([CARLA])
    mountWith()
    expect(wrapper.find('[data-test="heart-full"]').exists()).toBe(true)
    expect(button().attributes('aria-pressed')).toBe('true')
  })

  it('gives the heart on one tap, without asking, and tells the server', async () => {
    mountWith()
    await button().trigger('click')
    expect(dialog().exists()).toBe(false)
    expect(isFavorite(CARLA)).toBe(true)
    expect(mutateAdd).toHaveBeenCalledTimes(1)
    expect(mutateAdd).toHaveBeenCalledWith({ ref: { communityUuid: 'home', gradidoID: 'carla' } })
    expect(mutateRemove).not.toHaveBeenCalled()
  })

  it('asks before taking the heart away, and takes it only after "remove"', async () => {
    rememberFavorites([CARLA])
    mountWith()
    await button().trigger('click')
    expect(dialog().exists()).toBe(true)
    expect(wrapper.find('[data-test="favorite-remove-title"]').text()).toContain('Carla-Sonne')
    // Nothing has happened yet.
    expect(isFavorite(CARLA)).toBe(true)
    expect(mutateRemove).not.toHaveBeenCalled()

    await wrapper.find('[data-test="dialog-ok"]').trigger('click')
    await nextTick()
    expect(isFavorite(CARLA)).toBe(false)
    expect(mutateRemove).toHaveBeenCalledTimes(1)
    expect(mutateRemove).toHaveBeenCalledWith({
      ref: { communityUuid: 'home', gradidoID: 'carla' },
    })
  })

  it('sends null for a member without a community, and lets the server fill it in', async () => {
    mountWith({ member: { gradidoID: 'old-timer', alias: 'Emma' } })
    await button().trigger('click')
    expect(mutateAdd).toHaveBeenCalledWith({ ref: { communityUuid: null, gradidoID: 'old-timer' } })
  })

  it('puts the heart back and says so when the server refuses', async () => {
    mutateAdd.mockRejectedValueOnce(new Error('nope'))
    mountWith()
    await button().trigger('click')
    await nextTick()
    await nextTick()
    expect(isFavorite(CARLA)).toBe(false)
    expect(toastError).toHaveBeenCalledWith('nope')
  })

  it('shows the word beside the heart only when asked to', () => {
    mountWith({ label: true })
    expect(wrapper.text()).toContain('contacts.addFavorite')
    wrapper.unmount()
    mountWith()
    expect(wrapper.text()).not.toContain('contacts.addFavorite')
  })

  it('does not let its click reach the row around it', async () => {
    const outer = vi.fn()
    const Host = {
      components: { FavoriteHeart },
      template: '<div @click="outer"><favorite-heart :member="member" /></div>',
      setup: () => ({ outer, member: CARLA }),
    }
    wrapper = mount(Host, { global: globalOptions })
    await wrapper.find('[data-test="favorite-heart"]').trigger('click')
    expect(outer).not.toHaveBeenCalled()
    expect(mutateAdd).toHaveBeenCalledTimes(1)
  })
})
