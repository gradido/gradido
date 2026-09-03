import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import LastTransactions from './LastTransactions'
import { forgetAllMemberAvatars, rememberMemberAvatars } from '@/composables/useMemberAvatars'
import { LAST_TRANSACTIONS_PAGE_SIZE, LAST_TRANSACTIONS_ROWS } from '@/constants'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    // ⚠️ Values carried through, not dropped: the zoom button's label is the one string
    // here that has to name a particular member, and a mock returning the bare key would
    // make "labelled with the right person" indistinguishable from "labelled at all".
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date) => date,
  }),
}))

// ⚠️ The zoom composable builds its labels through `i18n.global.t`, because a composable is
// not a setup scope. This file replaces the whole `vue-i18n` module, so `@/i18n` would find
// no `createI18n` to call -- mocked here rather than widened above, so the vue-i18n stub
// keeps saying only what this component asks of it.
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

vi.mock('vue-avatar', () => ({
  default: {
    name: 'Avatar',
    template: '<div class="avatar"></div>',
  },
}))

vi.mock('@/components/TransactionRows/Name', () => ({
  default: {
    name: 'Name',
    template: '<div class="name"></div>',
  },
}))

vi.mock('@/components/FavoriteHeart.vue', () => ({
  default: {
    name: 'FavoriteHeart',
    props: ['member'],
    template: '<i class="heart-stub" />',
  },
}))

describe('LastTransactions', () => {
  let wrapper

  // ⚠️ Every wrapper here reads the picture store, which is reactive -- so one left mounted
  // goes on re-rendering when a later test stores or forgets a picture, outside the test
  // that built it and without the mocks that test provided. Three unhandled rejections and
  // a red run, from tests that all reported green.
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  const createWrapper = (props = {}) => {
    return mount(LastTransactions, {
      props,
      global: {
        stubs: {
          BRow: true,
          BCol: true,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component div.rightside-last-transactions', () => {
      expect(wrapper.find('div.rightside-last-transactions').exists()).toBe(true)
    })
  })

  it('renders the correct number of transactions', async () => {
    const transactions = [
      {
        id: 1,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'John', lastName: 'Doe' },
        amount: 100,
        balanceDate: '2023-01-01',
      },
      {
        id: 2,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'Jane', lastName: 'Smith' },
        amount: 200,
        balanceDate: '2023-01-02',
      },
    ]
    wrapper = createWrapper({ transactions })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.mb-4').length).toBe(2)
  })

  it('does not render DECAY, LINK_SUMMARY, or CREATION transactions', async () => {
    const transactions = [
      {
        id: 1,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'John', lastName: 'Doe' },
        amount: 100,
        balanceDate: '2023-01-01',
      },
      {
        id: 2,
        typeId: 'DECAY',
        linkedUser: { firstName: 'Jane', lastName: 'Smith' },
        amount: 200,
        balanceDate: '2023-01-02',
      },
      {
        id: 3,
        typeId: 'LINK_SUMMARY',
        linkedUser: { firstName: 'Bob', lastName: 'Johnson' },
        amount: 300,
        balanceDate: '2023-01-03',
      },
      {
        id: 4,
        typeId: 'CREATION',
        linkedUser: { firstName: 'Alice', lastName: 'Brown' },
        amount: 400,
        balanceDate: '2023-01-04',
      },
    ]
    wrapper = createWrapper({ transactions })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.mb-4').length).toBe(1)
  })

  /**
   * ⛔ The pair of constants, measured rather than compared.
   *
   * `LAST_TRANSACTIONS_PAGE_SIZE` exists ONLY to make `LAST_TRANSACTIONS_ROWS` reachable:
   * the layout asks for that many bookings, and this column then drops the two virtual rows
   * page one always carries plus every creation before it cuts to eight. Asserting one
   * constant against the other would be a tautology -- so this builds the page the server
   * really sends and counts what a member ends up seeing.
   *
   * The review of 30.08.2026 found this uncovered by setting the fetch size to 1: every test
   * in this file and in the layout's stayed green while the column would have shown one row.
   */
  it('fills the column from a page of the size the layout asks for', async () => {
    const booking = (id, typeId) => ({
      id,
      typeId,
      linkedUser: { firstName: 'John', lastName: 'Doe' },
      amount: 100,
      balanceDate: '2023-01-01',
    })
    // Two creations among the newest is the normal case, not the exception -- that is the
    // whole reason the fetch is bigger than the cut.
    const page = [
      ...Array.from({ length: LAST_TRANSACTIONS_PAGE_SIZE - 2 }, (_, i) =>
        booking(i + 1, 'TRANSFER'),
      ),
      booking(90, 'CREATION'),
      booking(91, 'CREATION'),
      // What the backend adds on top of page one, on top of the page size.
      booking(98, 'DECAY'),
      booking(99, 'LINK_SUMMARY'),
    ]

    wrapper = createWrapper({ transactions: page })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.mb-4').length).toBe(LAST_TRANSACTIONS_ROWS)
  })

  /**
   * The most prominent avatar in the wallet, and the one carrying decision AS-008.
   *
   * ⛔ Written because nothing measured either half: the size was a decision nobody could
   * see in a test, and the letters-from-alias rule is passed by this call site rather than
   * enforced by the component it calls.
   */
  describe('the avatar beside each booking', () => {
    const NAPOLI = {
      id: 3,
      amount: '-12.5',
      linkedUser: { firstName: 'Pizzeria', lastName: 'Napoli', alias: 'napoli' },
    }
    // Own mount: the shared helper stubs BRow/BCol with `true`, and such a stub does not
    // render what is inside it -- the avatar would never exist to be asked about.
    const mountRows = (transactions) =>
      mount(LastTransactions, {
        props: { transactions },
        global: {
          mocks: {
            $t: (key) => key,
            $d: (date) => String(date),
            $filters: { signedAmount: (amount) => String(amount) },
          },
          stubs: {
            BRow: { template: '<div><slot /></div>' },
            BCol: { template: '<div><slot /></div>' },
          },
        },
      })
    const avatar = () => wrapper.findComponent({ name: 'AppAvatar' })

    beforeEach(() => {
      forgetAllMemberAvatars()
    })

    // 64, not 72: the stored picture is 128 across, and 72 points on a 2x screen asks for
    // 144 -- more than exists, so it was visibly soft exactly where it is largest (AS-008).
    it('is 64 points, which is what the stored picture actually covers', () => {
      wrapper = mountRows([NAPOLI])
      expect(avatar().props().size).toBe(64)
    })

    it('shows the alias letters and keeps the colour on the real initials', () => {
      wrapper = mountRows([NAPOLI])
      expect(avatar().props().initials).toBe('NA')
      expect(avatar().props().colorSeed).toBe('PN')
    })

    /**
     * ⛔ The 64-point circle is the most prominent avatar in the wallet, and nothing in the
     * repo read `zoomable` here until this test: the whole `avatarZoomBindings` spread
     * could be deleted and every test stayed green, so the two call sites that show another
     * member's face could drift apart with nothing red (AS-018).
     */
    it('offers the picture at full size once the wallet holds one', async () => {
      const when = '2026-08-19T09:00:00.000Z'
      wrapper = mountRows([
        {
          ...NAPOLI,
          linkedUser: { ...NAPOLI.linkedUser, gradidoID: 'g-napoli', avatarUpdatedAt: when },
        },
      ])
      // The same row without a picture first, so the assertion below is demonstrably about
      // the picture and not about the row.
      expect(avatar().props().zoomable).toBeFalsy()

      rememberMemberAvatars([
        { gradidoID: 'g-napoli', communityUuid: null, avatar: 'pic', avatarUpdatedAt: when },
      ])
      await nextTick()

      expect(avatar().props().zoomable).toBe(true)
      expect(avatar().props().zoomLabel).toContain('napoli')
    })

    /**
     * ⛔ The same wrapper throughout, painted first and given the picture second -- which is
     * the order the wallet actually meets. The store is a plain Map, so the counter that
     * `storedMemberAvatar` reads is the only thing that tells a rendered row to look again.
     * Remounting between the two halves, which is what this test used to do, passes with
     * that counter deleted; the member would then see initials for the whole visit.
     */
    it('shows a picture the wallet holds, and nothing while it holds none', async () => {
      const when = '2026-08-19T09:00:00.000Z'
      wrapper = mountRows([
        {
          ...NAPOLI,
          linkedUser: { ...NAPOLI.linkedUser, gradidoID: 'g-napoli', avatarUpdatedAt: when },
        },
      ])
      expect(avatar().props().src).toBe('')

      rememberMemberAvatars([
        {
          gradidoID: 'g-napoli',
          communityUuid: null,
          avatar: 'the-picture',
          avatarUpdatedAt: when,
        },
      ])
      await nextTick()

      expect(avatar().props().src).toBe('data:image/jpeg;base64,the-picture')
    })

    /**
     * A booking whose counterparty the backend could not resolve arrives as
     * `linkedUser: null`. Here that is worse than one odd circle: the throw happens inside
     * this component's own `v-for`, so the whole "last bookings" panel disappears -- and
     * the name binding beside the avatar used to dereference it without a guard.
     */
    it('draws an empty circle rather than losing the whole list', () => {
      expect(() => {
        wrapper = mountRows([{ ...NAPOLI, linkedUser: null }])
      }).not.toThrow()
      expect(avatar().props().initials).toBe('')
      expect(avatar().props().name).toBe('')
    })
  })

  it('draws a heart beside every row that has a counterparty, and none where there is none', async () => {
    const transactions = [
      {
        id: 1,
        typeId: 'SEND',
        linkedUser: { alias: 'a', gradidoID: 'u-1' },
        amount: -1,
        balanceDate: '2026-01-01',
      },
      {
        id: 2,
        typeId: 'RECEIVE',
        linkedUser: { alias: 'b' },
        amount: 2,
        balanceDate: '2026-01-02',
      },
    ]
    // Slot-rendering stubs: the plain `true` stubs above swallow the columns' content.
    wrapper = mount(LastTransactions, {
      props: { transactions },
      global: {
        // With the columns rendering their content, the header's `$t` runs too.
        mocks: {
          $t: (key) => key,
          $d: (date) => String(date),
          $filters: { signedAmount: (amount) => String(amount) },
        },
        stubs: {
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
        },
      },
    })
    await nextTick()
    expect(wrapper.findAll('.heart-stub')).toHaveLength(1)
  })

  /**
   * ⛔ The counterpart of the same rule in `ContactsPanel.spec`: the switch over the column
   * is the heading, so this panel prints none. Its old one used the very key the switch's
   * left position now asks for, so a heading coming back would print
   * `transaction.lastTransactions` twice on one screen -- once in the tab, once beneath it.
   */
  it('prints no heading of its own -- the switch above carries it', () => {
    // ⚠️ Mounted here rather than through `createWrapper`, and the difference decides
    // whether this measures anything: that helper stubs `BCol: true`, and an auto-stub
    // renders no slot content at all -- the heading's words would be missing from
    // `text()` whether or not the heading existed. These stubs pass their slot through.
    wrapper = mount(LastTransactions, {
      props: { transactions: [] },
      global: {
        mocks: { $t: (key) => key, $d: (date) => String(date) },
        stubs: {
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.text()).not.toContain('transaction.lastTransactions')
  })
})
