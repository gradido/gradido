// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import {
  BButton,
  BCol,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BRow,
} from 'bootstrap-vue-next'
import i18n from '@/i18n'
import { loadAllRules } from '@/validation-rules'
import RedeemThanks from './RedeemThanks.vue'
import RedeemThanksAccount from './RedeemThanksAccount.vue'
import RedeemThanksPaper from './RedeemThanksPaper.vue'

/**
 * The form an account is opened with, and the browser's way back (ZE-017 F5): the form stands
 * on the page of the thank-you, under the same address, and "back" leads from it to the sheet.
 * Whoever loads the page again sees the sheet.
 *
 * With the history of the browser, as the wallet runs with it: a router that keeps its own
 * list of addresses knows nothing of the state an entry carries, and that state is the point.
 * RedeemThanks.spec.js holds everything else about the view.
 */
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ onResult: () => {} }),
  useMutation: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn() }),
}))

const CODE = 'c0ffee1234567890abcdef12'
const MARK = 'redeemThanksAccount'

const link = () => ({
  __typename: 'TransactionLink',
  id: 7,
  amount: '20',
  memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
  createdAt: '2026-06-28T09:30:00.000Z',
  validUntil: '2026-07-12T09:30:00.000Z',
  redeemedAt: null,
  deletedAt: null,
  senderUser: {
    gradidoID: '76378cbb-5a5c-4e4b-9a3b-1f2d3c4b5a69',
    alias: 'Oma-Emma',
    publisherId: null,
  },
  communities: [],
})

const page = { template: '<div />' }
const newRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: page },
      { name: 'Redeem', path: '/redeem/:code', component: page },
      { name: 'Login', path: '/login/:code?', component: page },
      { path: '/overview', component: page },
      { path: '/contacts', component: page },
    ],
  })

const mounted = []
const view = (router, state = 'LOGGED_OUT') => {
  const wrapper = mount(RedeemThanks, {
    props: { linkData: link(), state, redeemCode: CODE },
    global: {
      plugins: [i18n, router],
      components: { BButton, BCol, BFormGroup, BFormInput, BFormInvalidFeedback, BRow },
      stubs: { IBiEye: true, IBiEyeSlash: true },
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}

const accept = (wrapper) => wrapper.find('[data-test="redeem-thanks-accept"]')
const form = (wrapper) => wrapper.findComponent(RedeemThanksAccount)
const sheet = (wrapper) => wrapper.findComponent(RedeemThanksPaper)

/** A step in the browser's history, and the event the browser sends once it is taken. */
const step = async (router, by) => {
  const arrived = new Promise((resolve) => {
    window.addEventListener('popstate', resolve, { once: true })
  })
  router.go(by)
  await arrived
  await flushPromises()
}

describe('RedeemThanks: the form and the way back', () => {
  let router

  beforeAll(() => {
    loadAllRules(i18n.global)
  })

  beforeEach(async () => {
    i18n.global.locale.value = 'de'
    router = newRouter()
    // Where the guest came from, and then the link.
    await router.push('/')
    await router.push(`/redeem/${CODE}?project=probe`)
    await router.isReady()
  })

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  it('opens the form as a step of its own, under the address of the link', async () => {
    const wrapper = view(router)
    const before = window.history.length

    await accept(wrapper).trigger('click')
    await flushPromises()

    expect(form(wrapper).exists()).toBe(true)
    expect(window.history.length).toBe(before + 1)
    expect(window.location.pathname).toBe(`/redeem/${CODE}`)
    expect(window.location.search).toBe('?project=probe')
    expect(window.history.state[MARK]).toBe(true)
  })

  it('leads back from the form to the sheet, and stays on the link', async () => {
    const wrapper = view(router)
    await accept(wrapper).trigger('click')
    await flushPromises()

    await step(router, -1)

    expect(form(wrapper).exists()).toBe(false)
    expect(sheet(wrapper).exists()).toBe(true)
    expect(accept(wrapper).text()).toBe('Dank annehmen')
    expect(window.location.pathname).toBe(`/redeem/${CODE}`)
    expect(router.currentRoute.value.name).toBe('Redeem')
  })

  it('opens the form again with the step forward', async () => {
    const wrapper = view(router)
    await accept(wrapper).trigger('click')
    await flushPromises()
    await step(router, -1)

    await step(router, 1)

    expect(form(wrapper).exists()).toBe(true)
    expect(sheet(wrapper).exists()).toBe(false)
  })

  // The history keeps the state of an entry across a reload. A page loaded again is built
  // anew: it shows the sheet, and the entry no longer says "form".
  it('shows the sheet to whoever loads the page again while the form was open', async () => {
    const first = view(router)
    await accept(first).trigger('click')
    await flushPromises()
    expect(window.history.state[MARK]).toBe(true)
    first.unmount()

    const again = view(router)
    await flushPromises()

    expect(form(again).exists()).toBe(false)
    expect(sheet(again).exists()).toBe(true)
    expect(window.history.state[MARK]).toBe(false)
    // What the router keeps in the entry stays as it was.
    expect(window.history.state.current).toBe(`/redeem/${CODE}?project=probe`)
  })

  it('leaves the entry of a page alone that was never the form', async () => {
    const before = { ...window.history.state }

    view(router)
    await flushPromises()

    expect(window.history.state).toEqual(before)
  })

  it('stops following the history once the view is gone', async () => {
    const wrapper = view(router)
    await accept(wrapper).trigger('click')
    await flushPromises()
    const removed = vi.spyOn(window, 'removeEventListener')

    wrapper.unmount()

    expect(removed).toHaveBeenCalledWith('popstate', expect.any(Function))
    removed.mockRestore()
  })

  // A member has an account: the mark of an entry opens nothing for them.
  it('opens no form for a member, whatever the entry says', async () => {
    const wrapper = view(router, 'LOGGED_OUT')
    await accept(wrapper).trigger('click')
    await flushPromises()

    await wrapper.setProps({ state: 'VALID' })

    expect(form(wrapper).exists()).toBe(false)
    expect(sheet(wrapper).exists()).toBe(true)
  })
})
