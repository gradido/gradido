// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { walletStore } from '@test/walletStore'
import { useWalletStore } from '@/store/useWalletStore'
import { forgetWayBack, goBackToAdmin } from '@/utils/adminWayBack'
import AdminWayBackBar from './AdminWayBackBar.vue'

// ⚠️ The step back is caught here, not at window.location: under the vmThreads pool the global
// is jsdom's own window, whose location can be neither deleted nor replaced. What the step does
// is utils/adminWayBack.spec.js; here only that the bar takes it, with what.
vi.mock('@/utils/adminWayBack', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    goBackToAdmin: vi.fn(({ win } = {}) => {
      actual.forgetWayBack(win)
      return 'went'
    }),
  }
})

const ADMIN_PAGE = '/creation-confirm'

describe('AdminWayBackBar', () => {
  let router
  let pinia

  const mountBar = async (path) => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:any(.*)*', component: { template: '<div />' } }],
    })
    await router.push(path)
    await router.isReady()
    return mount(AdminWayBackBar, {
      global: {
        plugins: [router, pinia],
        mocks: { $t: (key) => key },
        // The specs resolve no icons.
        stubs: { IBiArrowLeft: true },
      },
    })
  }
  const bar = (wrapper) => wrapper.find('[data-test="admin-way-back"]')
  const moved = () => document.documentElement.classList.contains('has-admin-way-back')

  beforeEach(() => {
    vi.clearAllMocks()
    forgetWayBack()
    pinia = walletStore({ token: 'valid-token', gradidoID: 'g-anna' })
  })

  afterEach(() => {
    forgetWayBack()
    document.documentElement.classList.remove('has-admin-way-back')
  })

  // The bar stands over every page; shown where nobody came from the admin interface it would
  // be a way into it for every member.
  it('shows nothing where the wallet was not opened from the admin interface', async () => {
    const wrapper = await mountBar('/overview')
    expect(bar(wrapper).exists()).toBe(false)
    expect(moved()).toBe(false)
  })

  it('appears on a page a pin of the admin interface opened, and moves the page down', async () => {
    const wrapper = await mountBar(
      `/matching/karte?with=g-bibi&admin=${encodeURIComponent(ADMIN_PAGE)}`,
    )
    expect(bar(wrapper).exists()).toBe(true)
    expect(bar(wrapper).element.tagName).toBe('BUTTON')
    expect(bar(wrapper).attributes('type')).toBe('button')
    expect(bar(wrapper).text()).toContain('adminWayBack')
    expect(moved()).toBe(true)
  })

  // The conversation drops `with`, `community` and all from its address once its window is
  // open; the way back stays while the moderator is in the wallet.
  it('stays when the page drops the admin page from its address, and on the next page', async () => {
    const wrapper = await mountBar(`/contacts?with=g-bibi&admin=${encodeURIComponent(ADMIN_PAGE)}`)
    await router.replace('/contacts')
    await router.push('/transactions')
    await nextTick()
    expect(bar(wrapper).exists()).toBe(true)
  })

  it('is no way back for another member signed in later', async () => {
    const wrapper = await mountBar(`/matching/karte?admin=${encodeURIComponent(ADMIN_PAGE)}`)
    useWalletStore(pinia).gradidoID = 'g-ben'
    await nextTick()
    expect(bar(wrapper).exists()).toBe(false)
    expect(moved()).toBe(false)
  })

  it('names no other site as the way back', async () => {
    const wrapper = await mountBar(`/matching/karte?admin=${encodeURIComponent('//evil.example')}`)
    expect(bar(wrapper).exists()).toBe(false)
  })

  it('goes back to the page the moderator came from, and goes away', async () => {
    const wrapper = await mountBar(`/matching/karte?admin=${encodeURIComponent(ADMIN_PAGE)}`)
    await bar(wrapper).trigger('click')

    expect(goBackToAdmin).toHaveBeenCalledTimes(1)
    expect(goBackToAdmin.mock.calls[0][0]).toMatchObject({ token: 'valid-token', back: ADMIN_PAGE })
    expect(bar(wrapper).exists()).toBe(false)
    expect(moved()).toBe(false)
  })
})
