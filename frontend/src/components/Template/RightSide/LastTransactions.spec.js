import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import LastTransactions from './LastTransactions'
import { forgetAllMemberAvatars, rememberMemberAvatars } from '@/composables/useMemberAvatars'
import { LAST_TRANSACTIONS_PAGE_SIZE, LAST_TRANSACTIONS_ROWS, LIST_AVATAR_SIZE } from '@/constants'

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

// ⚠️ The stub RAISES the event, and takes the member from its own prop. A stub that only
// rendered a div would leave `@open` untested while every assertion here stayed green --
// the wiring, not the name, is what this column does with it.
vi.mock('@/components/TransactionRows/Name', () => ({
  default: {
    name: 'Name',
    props: ['linkedUser'],
    emits: ['open'],
    template:
      '<div class="name"><button data-test="name-open" @click="$emit(\'open\', linkedUser)" /></div>',
  },
}))

const mockApolloQuery = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: mockApolloQuery } }),
}))

/**
 * The column's OTHER way into a booking -- the one the name does not take.
 *
 * ⚠️ Mocked module-wide rather than per mount, and that is what makes a click measurable
 * here at all: without a store and a router the component's `handleRedirect` throws on the
 * first line, so every test that taps anything but the name would be reporting the
 * exception rather than the behaviour.
 */
const { mockDispatch, mockReplace } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockReplace: vi.fn(),
}))
vi.mock('vuex', () => ({ useStore: () => ({ dispatch: mockDispatch }) }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useRoute: () => ({ name: 'Overview' }),
}))

/**
 * ⚠️ In EVERY mount in this file, not only the ones that ask about it. Four mounts here
 * carry their own stubs, and the three that left this one out pulled the real modal in --
 * `BModal` then went looking for a router-link and a modal-manager injection that no test
 * provides. They passed while doing it, so the noise was the only sign.
 */
const contactWindowStub = {
  ContactWindow: {
    name: 'ContactWindow',
    props: ['modelValue', 'contact'],
    template:
      '<div data-test="contact-window" :data-open="String(modelValue)" :data-who="contact?.user?.gradidoID ?? \'\'" :data-bookings="String(contact?.bookings)" />',
  },
}

vi.mock('@/components/FavoriteHeart.vue', () => ({
  default: {
    name: 'FavoriteHeart',
    props: ['member'],
    template: '<i class="heart-stub" />',
  },
}))

/**
 * ⚠️ `VariantIcon` is auto-imported by the build (unplugin-vue-components) and by nothing at
 * all under vitest, so a creation row would render it as an unknown element and warn. Its
 * own icons come from unplugin-icons and are just as absent here.
 *
 * ⛔ `BAvatar` is deliberately NOT stubbed anywhere in this file: `rounded` and `variant` are
 * names bootstrap-vue-next gives, and a stub answers to any name one cares to write. What
 * the gift row asserts is what the real component MAKES of them.
 */
const variantIconStub = {
  VariantIcon: {
    name: 'VariantIcon',
    props: ['icon'],
    template: '<i class="icon-stub" :data-icon="icon" />',
  },
}

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
        // ⚠️ `$t` is needed again. It was not before, and not because the component did
        // without it: its heading sat inside a `BCol` that these auto-stubs render without
        // their slot, so the call was never reached. The screen-reader heading stands free
        // in the template, so every mount evaluates it.
        mocks: { $t: (key) => key },
        stubs: {
          BRow: true,
          BCol: true,
          ...contactWindowStub,
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
    expect(wrapper.findAll('.last-transactions-row').length).toBe(2)
  })

  it('does not render DECAY or LINK_SUMMARY transactions, and does render creations', async () => {
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
        linkedUser: { alias: 'Gradido Akademie', gradidoID: 'community-stand-in' },
        amount: 400,
        balanceDate: '2023-01-04',
      },
    ]
    wrapper = createWrapper({ transactions })
    await wrapper.vm.$nextTick()
    // The transfer and the creation: the two virtual rows are dropped, the creation stays
    // (12.09.2026).
    expect(wrapper.findAll('.last-transactions-row').length).toBe(2)
  })

  /**
   * ⛔ The pair of constants, measured rather than compared.
   *
   * `LAST_TRANSACTIONS_PAGE_SIZE` exists ONLY to make `LAST_TRANSACTIONS_ROWS` reachable:
   * the layout asks for that many bookings, and this column then drops the two virtual rows
   * page one always carries before it cuts to eight. Asserting one constant against the
   * other would be a tautology -- so this builds the page the server really sends and counts
   * what a member ends up seeing.
   *
   * Since creations stand here too (12.09.2026) the page is no longer bigger than the cut;
   * what this still measures is that the two virtual rows do not eat a place, because the
   * backend adds them ON TOP of the page it was asked for.
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
    // Two creations among the newest is the normal case, not the exception -- and they now
    // take their place in the column like any other booking.
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

    expect(wrapper.findAll('.last-transactions-row').length).toBe(LAST_TRANSACTIONS_ROWS)
  })

  /**
   * The avatar beside each booking, and the one carrying decision AS-008.
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
            ...contactWindowStub,
          },
        },
      })
    const avatar = () => wrapper.findComponent({ name: 'AppAvatar' })

    beforeEach(() => {
      forgetAllMemberAvatars()
    })

    // ⛔ The size every list of people uses (each of the other lists' specs proves its own
    // half), and inside both bounds that one number answers to: at least the smallest tap
    // target this wallet gives anything, because the face opens the picture (AS-018) -- and
    // at most what the stored picture covers on a 2x screen, which asks for twice the points
    // of a picture 128 across. At 72 this column was visibly soft (AS-008).
    it('is the size every list of people uses, inside both of its bounds', () => {
      wrapper = mountRows([NAPOLI])
      expect(avatar().props().size).toBe(LIST_AVATAR_SIZE)
      expect(LIST_AVATAR_SIZE).toBeGreaterThanOrEqual(44)
      expect(LIST_AVATAR_SIZE * 2).toBeLessThanOrEqual(128)
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

  /**
   * ⛔ The two pieces of wiring the heart's position hangs on, and nothing measured either:
   * ONE row per booking, and `min-w-0` on the column that grows. Delete either and every
   * other test in this file stays green while the heart drops onto a line of its own again
   * -- at a different width for every booking, because a `.col` without `min-width: 0`
   * floors at its own widest unbreakable text (the fault Bernd reported on 04.09.2026).
   *
   * ⚠️ What this canNOT see is the CSS itself: jsdom does no layout, so `min-width: 0`
   * proves nothing here as a rule -- only as a class that is present on the right column.
   * The widths in the component's own comments were measured in a browser against the real
   * Bootstrap grid, not here.
   */
  it('keeps the heart in the booking own row, beside a column that may shrink', () => {
    wrapper = mount(LastTransactions, {
      props: {
        transactions: [
          {
            id: 7,
            typeId: 'SEND',
            linkedUser: { alias: 'paula', gradidoID: 'u-7' },
            amount: -45,
            balanceDate: '2026-08-26',
          },
        ],
      },
      global: {
        mocks: {
          $t: (key) => key,
          $d: (date) => String(date),
          $filters: { signedAmount: (amount) => String(amount) },
        },
        stubs: {
          BRow: { template: '<div class="row-stub"><slot /></div>' },
          BCol: { template: '<div class="col-stub"><slot /></div>' },
        },
      },
    })

    // One row, not a row inside a row: the nested one is what let the heart wrap.
    expect(wrapper.findAll('.row-stub')).toHaveLength(1)

    // Face, text and heart are the three columns OF that row -- the heart a sibling of the
    // name's column, not a passenger in a second row underneath it.
    const nameColumn = wrapper.find('.name').element.closest('.col-stub')
    const heartColumn = wrapper.find('.heart-stub').element.closest('.col-stub')
    expect(nameColumn.parentElement).toBe(heartColumn.parentElement)
    expect(nameColumn.parentElement.className).toContain('row-stub')

    // And the name's column is the one allowed to give way.
    expect(nameColumn.className).toContain('min-w-0')
  })

  /**
   * ⛔ The two positions of the switch over this column are drawn to ONE measure: the
   * contacts' (Bernd, 11.09.2026 -- the bookings were larger and roomier, and he wanted
   * theirs for both). Most of that measure is CSS, and jsdom lays nothing out, so the numbers
   * are read where they are written and held against the contacts' own. A change to either
   * file alone turns this red, which is the point: the two only look alike while they agree.
   */
  describe('drawn to the measure of the contacts beside it', () => {
    // ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node
    // rejects an instance of it as coming from another realm.
    const here = dirname(fileURLToPath(import.meta.url))
    // ⚠️ Comments OUT first. These files explain themselves at length, and a note that names
    // the very declaration below it would answer this search instead of the code -- an
    // injection that deleted `contain: inline-size` stayed green on 11.09.2026 for exactly
    // that reason, in the booking list's spec.
    const styleOf = (file) => {
      const source = readFileSync(join(here, file), 'utf8')
      return source.slice(source.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')
    }
    const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    /** What one rule gives one property -- undefined if either is missing. */
    const declared = (css, selector, property) => {
      const rule = new RegExp(`(?:^|\\n)${escape(selector)}\\s*\\{([^}]*)\\}`).exec(css)
      if (!rule) return undefined
      const value = new RegExp(`(?:^|[\\s;])${escape(property)}\\s*:\\s*([^;]+);`).exec(rule[1])
      return value?.[1].trim()
    }

    const bookings = styleOf('LastTransactions.vue')
    const contacts = styleOf('ContactsPanel.vue')

    it.each([
      [
        'the name',
        ['.last-transactions-name', 'font-size'],
        ['.contacts-panel-who-name', 'font-size'],
      ],
      [
        'the line under the name',
        ['.transaction-details-link', 'font-size'],
        ['.contacts-panel-who-community', 'font-size'],
      ],
      [
        'the room above and below a row',
        ['.last-transactions-row', 'padding'],
        ['.contacts-panel-row', 'padding'],
      ],
      [
        'the room between face, text and heart',
        ['.last-transactions-row', 'column-gap'],
        ['.contacts-panel-row', 'gap'],
      ],
      [
        'the line between two rows',
        ['.last-transactions-row + .last-transactions-row', 'border-top'],
        ['.contacts-panel-row', 'border-bottom'],
      ],
    ])('%s', (_, [ourRule, ourProperty], [theirRule, theirProperty]) => {
      const ours = declared(bookings, ourRule, ourProperty)
      const theirs = declared(contacts, theirRule, theirProperty)
      // ⚠️ Both found FIRST: two missing values are equal too, and would pass for a match.
      expect(ours).toBeTruthy()
      expect(theirs).toBeTruthy()
      expect(ours).toBe(theirs)
    })

    // The parts of the measure that live in the markup rather than the stylesheet.
    const mountRow = () =>
      mount(LastTransactions, {
        props: {
          transactions: [
            {
              id: 7,
              typeId: 'SEND',
              linkedUser: { alias: 'paula', gradidoID: 'u-7' },
              amount: -45,
              balanceDate: '2026-08-26',
            },
          ],
        },
        global: {
          mocks: {
            $t: (key) => key,
            $d: (date) => String(date),
            $filters: { signedAmount: (amount) => String(amount) },
          },
          stubs: {
            BRow: { template: '<div class="row-stub"><slot /></div>' },
            BCol: { template: '<div class="col-stub"><slot /></div>' },
            ...contactWindowStub,
          },
        },
      })

    // Bootstrap's gutters would run the row -- and the line between two rows -- 12 points
    // past the column on both sides, and put 24 points between face and name where the
    // contacts have 8.
    it('takes the gutters out of the row', () => {
      wrapper = mountRow()
      expect(wrapper.find('.last-transactions-row').classes()).toContain('g-0')
    })

    // The contacts' second line stands directly under the name; this one had a margin of a
    // whole line-height between them.
    it('sets the line under the name directly beneath it', () => {
      wrapper = mountRow()
      const line = wrapper.find('.transaction-details-link')
      expect(line.exists()).toBe(true)
      expect(line.classes().filter((name) => /^m[ty]-/.test(name))).toEqual([])
    })

    // `.small` on either half would shrink it again, to 0.8 of the line's own size.
    it('gives both halves of that line the one size the line sets', () => {
      wrapper = mountRow()
      expect(wrapper.findAll('.transaction-details-link span')).toHaveLength(2)
      expect(wrapper.findAll('.transaction-details-link .small')).toHaveLength(0)
    })

    /**
     * ⛔ The load-bearing line of the memo change, and nothing else holds it.
     *
     * A row is as tall as the taller of its two sides, and the face is 48 points. With the
     * memo the text beside it became three lines, and at the wallet's 1.5 they add up to
     * more than that -- the bookings would grow taller than the contacts in the other
     * position of the switch, which is the one thing the measure above exists to prevent.
     * The column therefore sets a tighter line-height, and this holds the arithmetic:
     * three type sizes times that line-height, plus the transparent border under the amount
     * line, against the face.
     *
     * Delete the `line-height` rule and this is red; raise a type size past what the face
     * allows and it is red too -- which is what a test for a number nobody can see has to do.
     */
    it('keeps the three lines together shorter than the face beside them', () => {
      const ROOT_FONT_SIZE = 16
      const points = (rule) => parseFloat(declared(bookings, rule, 'font-size')) * ROOT_FONT_SIZE
      const lineHeight = Number(declared(bookings, '.last-transactions-text', 'line-height'))

      expect(lineHeight).toBeGreaterThan(0)

      const textBlock =
        (points('.last-transactions-name') +
          points('.transaction-details-link') +
          points('.last-transactions-memo')) *
          lineHeight +
        // the transparent border the amount line carries for its hover
        1

      expect(textBlock).toBeLessThanOrEqual(LIST_AVATAR_SIZE)
    })

    /**
     * The memo is one line and is cut, rather than growing the row to two or three -- it is
     * the only line here written by somebody else, so it is the only one that can be long.
     *
     * ⚠️ `contain` is asserted with them because it belongs to `nowrap` wherever that is
     * written (#3886), NOT because it was found to do something here: taken away in the
     * dashboard's own columns at 1250 and 1440 points, the page and this column kept their
     * width to the point. This column is a fixed share of the row, so nothing above it is
     * sized by its content. The pair is kept together so a later move of this row cannot
     * separate them.
     */
    it('keeps the memo to one cut line', () => {
      expect(declared(bookings, '.last-transactions-memo', 'white-space')).toBe('nowrap')
      expect(declared(bookings, '.last-transactions-memo', 'text-overflow')).toBe('ellipsis')
      expect(declared(bookings, '.last-transactions-memo', 'contain')).toBe('inline-size')
    })

    // ⚠️ The rule above is worth nothing if the column it sets does not reach the markup --
    // and a class in a template is exactly the kind of wiring no test usually covers.
    it('sets that line-height on the column the three lines stand in', () => {
      wrapper = mountRow()
      const text = wrapper.find('.last-transactions-text')

      expect(text.exists()).toBe(true)
      expect(text.find('.last-transactions-name').exists()).toBe(true)
      expect(text.find('.transaction-details-link').exists()).toBe(true)
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
      // ⛔ A creation, and its stand-in carries a gradidoID exactly as a member does
      // (backend/src/util/communityUser.ts). Reading that field alone -- as this column did
      // until creations were let in -- puts a heart here and lets a member mark "the
      // community" as a favourite.
      {
        id: 3,
        typeId: 'CREATION',
        linkedUser: { alias: 'Gradido Akademie', gradidoID: 'community-stand-in' },
        amount: 400,
        balanceDate: '2026-01-03',
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
          ...contactWindowStub,
          ...variantIconStub,
        },
      },
    })
    await nextTick()
    expect(wrapper.findAll('.heart-stub')).toHaveLength(1)
  })

  /**
   * The memo in the row (Bernd, 12.09.2026) -- what the booking list has carried since
   * 11.09.2026, in this column's measure: the first line, italic and muted, cut with an
   * ellipsis, and no heading over it.
   */
  describe('the memo under a booking', () => {
    const booking = (memo) => ({
      id: 12,
      typeId: 'SEND',
      amount: '-12',
      balanceDate: '2026-01-01',
      linkedUser: { alias: 'margret', gradidoID: 'id-margret' },
      memo,
    })

    // Slot-rendering stubs: the shared helper's `true` stubs swallow the columns, and the
    // memo lives inside one.
    const mountRow = (transaction) =>
      mount(LastTransactions, {
        props: { transactions: [transaction] },
        global: {
          mocks: {
            $t: (key) => key,
            $d: (date) => String(date),
            $filters: { signedAmount: (amount) => String(amount) },
          },
          stubs: {
            BRow: { template: '<div><slot /></div>' },
            BCol: { template: '<div><slot /></div>' },
            ...contactWindowStub,
            ...variantIconStub,
          },
        },
      })

    const memoLine = () => wrapper.find('[data-test="last-transactions-memo"]')

    beforeEach(() => {
      mockDispatch.mockReset()
      mockReplace.mockReset()
    })

    it('shows what the sender wrote', () => {
      wrapper = mountRow(booking('Danke fuer die Suppe'))

      expect(memoLine().exists()).toBe(true)
      expect(memoLine().text()).toBe('Danke fuer die Suppe')
    })

    // Practically never: `memo` cannot be null in the database and every path that books
    // demands at least five characters. The line goes away rather than standing empty.
    it('leaves the line out where a booking carries no memo', () => {
      wrapper = mountRow(booking(''))

      expect(memoLine().exists()).toBe(false)
    })

    /**
     * ⛔ Never as markup. A memo is written by the OTHER side of the booking, and three
     * components used to hand it to the page as HTML (#3884). `MemoText` cuts it into text
     * and addresses; both reach the page through Vue, which escapes them.
     */
    it('renders an address in it as a link, and its markup as text', () => {
      wrapper = mountRow(booking('<b>hi</b> see https://gradido.net'))

      const link = memoLine().find('a')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://gradido.net')
      expect(memoLine().html()).not.toContain('<b>')
      expect(memoLine().text()).toContain('<b>hi</b>')
    })

    /**
     * A tap leads to the booking, exactly as the amount line above it does -- and there the
     * whole memo stands, so the cut line has somewhere to be read out.
     */
    it('takes a tap to the booking', async () => {
      wrapper = mountRow(booking('Danke fuer die Suppe'))

      await memoLine().trigger('click')

      expect(mockDispatch).toHaveBeenCalledWith('changeTransactionToHighlightId', 12)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'Transactions' })
    })

    // ⚠️ A link inside the memo keeps its own click (MemoText). Without that, following an
    // address in a memo would ALSO navigate to the booking -- and the booking would win.
    it('lets a link in it keep its own click', async () => {
      wrapper = mountRow(booking('see https://gradido.net'))

      // jsdom cannot navigate and says so on every followed link; stopped before it tries.
      const noNavigation = (event) => event.preventDefault()
      document.addEventListener('click', noNavigation, true)
      await memoLine().find('a').trigger('click')
      document.removeEventListener('click', noNavigation, true)

      expect(mockDispatch).not.toHaveBeenCalled()
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

  /**
   * Creations in the column (Bernd, 12.09.2026). They were filtered out from the start, and
   * every one of the three things below is the reason it was not merely a filter to delete:
   * the row names a community, and the community's stand-in looks like a member.
   */
  describe('a creation among the bookings', () => {
    const creation = {
      id: 21,
      typeId: 'CREATION',
      amount: '400',
      balanceDate: '2026-01-03',
      memo: 'Gartenarbeit im Gemeinschaftsgarten',
      // What the backend really sends: the community's stand-in, gradidoID and all
      // (backend/src/util/communityUser.ts).
      linkedUser: {
        alias: 'Gradido Akademie',
        gradidoID: '11111111-2222-4333-4444-55555555',
        communityName: 'Gradido Akademie',
      },
    }

    const mountCreation = () =>
      mount(LastTransactions, {
        props: { transactions: [creation] },
        global: {
          mocks: {
            $t: (key) => key,
            $d: (date) => String(date),
            $filters: { signedAmount: (amount) => String(amount) },
          },
          stubs: {
            BRow: { template: '<div><slot /></div>' },
            BCol: { template: '<div><slot /></div>' },
            ...contactWindowStub,
            ...variantIconStub,
          },
        },
      })

    /**
     * ⛔ Measured at the REAL `BAvatar`, not at a stub: `rounded` and `variant` are its own
     * prop names, and a stub declares whatever one writes into it. What is asserted is what
     * the component MAKES of them -- a green square instead of the grey circle it draws
     * without them.
     */
    it('wears the gift square instead of a face', () => {
      wrapper = mountCreation()

      const gift = wrapper.find('[data-test="creation-gift"]')
      expect(gift.exists()).toBe(true)
      expect(gift.classes()).toContain('text-bg-success')
      expect(gift.classes()).not.toContain('rounded-circle')
      expect(gift.attributes('style')).toContain(`width: ${LIST_AVATAR_SIZE}px`)
      expect(gift.find('[data-icon="gift"]').exists()).toBe(true)
      // And no member's circle beside it.
      expect(wrapper.find('.app-avatar').exists()).toBe(false)
    })

    /**
     * ⛔ The name is TEXT here. `Name` turns itself into a button for anybody with a
     * gradidoID, and the stand-in has one -- so handed over it would offer a contact window
     * about "the community", and the lookup behind it would ask about a member who does not
     * exist.
     */
    it('names the community without offering a contact window about it', async () => {
      wrapper = mountCreation()

      expect(wrapper.find('.last-transactions-community').text()).toBe('Gradido Akademie')
      expect(wrapper.find('[data-test="name-open"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="contact-window"]').attributes()['data-open']).toBe('false')
      expect(mockApolloQuery).not.toHaveBeenCalled()
    })

    // Nobody to mark: a community is not a favourite. The gradidoID of the stand-in must
    // not be read as "there is a person here" -- see the heart test above.
    it('carries no heart', () => {
      wrapper = mountCreation()

      expect(wrapper.find('.heart-stub').exists()).toBe(false)
    })

    // The creation's own words -- the contribution text -- in the row like any other memo.
    it('shows the contribution text as its memo', () => {
      wrapper = mountCreation()

      expect(wrapper.find('[data-test="last-transactions-memo"]').text()).toBe(
        'Gartenarbeit im Gemeinschaftsgarten',
      )
    })
  })

  /**
   * ⛔ The counterpart of the same rule in `ContactsPanel.spec`: the switch over the column
   * is the heading, so this panel prints none. Its old one used the very key the switch's
   * left position now asks for, so a heading coming back would print
   * `transaction.lastTransactions` twice on one screen -- once in the tab, once beneath it.
   */
  it('names the column for a screen reader, and only for one', () => {
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
          ...contactWindowStub,
        },
      },
    })

    const heading = wrapper.find('h2')

    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('transaction.lastTransactions')
    expect(heading.classes()).toContain('visually-hidden')
    expect(wrapper.text().split('transaction.lastTransactions')).toHaveLength(2)
  })

  /**
   * The column's half of KF-010: a tap on a member means "this person" here exactly as it
   * does in the contact list. What this column can hand over is the MEMBER off the booking
   * row; the three figures the window states are a grouping over all bookings with them,
   * and they arrive from the lookup a moment later.
   */
  describe('the contact window it opens', () => {
    const margret = { gradidoID: 'id-margret', alias: 'margret', communityUuid: 'home-uuid' }
    const transactions = [
      { id: 1, typeId: 'SEND', amount: '-12', balanceDate: '2026-01-01', linkedUser: margret },
    ]

    // Slot-rendering stubs: the `true` stubs of the shared helper swallow the columns, and
    // the name -- the control this whole block is about -- lives inside one.
    const mountColumn = () =>
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
            ...contactWindowStub,
          },
        },
      })

    const windowAttrs = () => wrapper.find('[data-test="contact-window"]').attributes()

    beforeEach(() => {
      mockApolloQuery.mockReset()
    })

    it('stays closed until a name is tapped', () => {
      mockApolloQuery.mockResolvedValue({ data: { contactList: { contacts: [] } } })
      wrapper = mountColumn()

      expect(windowAttrs()['data-open']).toBe('false')
      expect(mockApolloQuery).not.toHaveBeenCalled()
    })

    /**
     * ⛔ Open BEFORE the answer, on what the row already carries. Waiting for the round
     * trip would be a tap that does nothing for as long as the network takes -- which on a
     * phone reads as a broken button, and the member taps again.
     */
    it('opens on the tapped member at once, without waiting for the lookup', async () => {
      // A lookup that never answers, so what is on screen here is the provisional half.
      mockApolloQuery.mockReturnValue(new Promise(() => {}))
      wrapper = mountColumn()

      await wrapper.find('[data-test="name-open"]').trigger('click')
      await nextTick()

      expect(windowAttrs()['data-open']).toBe('true')
      expect(windowAttrs()['data-who']).toBe('id-margret')
      // Nothing invented: the figures are absent, not zero.
      expect(windowAttrs()['data-bookings']).toBe('undefined')
    })

    it('asks about the pair the row carries', async () => {
      mockApolloQuery.mockResolvedValue({ data: { contactList: { contacts: [] } } })
      wrapper = mountColumn()

      await wrapper.find('[data-test="name-open"]').trigger('click')
      await flushPromises()

      expect(mockApolloQuery).toHaveBeenCalledTimes(1)
      expect(mockApolloQuery.mock.calls[0][0].variables).toEqual({
        ref: { gradidoID: 'id-margret', communityUuid: 'home-uuid' },
      })
    })

    it('fills in the figures the lookup brings', async () => {
      const contact = { user: margret, firstAt: '2025-08-01', lastAt: '2026-01-01', bookings: 51 }
      mockApolloQuery.mockResolvedValue({ data: { contactList: { contacts: [contact] } } })
      wrapper = mountColumn()

      await wrapper.find('[data-test="name-open"]').trigger('click')
      await flushPromises()
      await nextTick()

      expect(windowAttrs()['data-open']).toBe('true')
      expect(windowAttrs()['data-bookings']).toBe('51')
    })

    /**
     * ⛔ A failed lookup is not a failed window. Everything the member came for -- the two
     * buttons and the heart -- stands on the row's own data; only the grey figures stay
     * away. Tearing the window down, or shouting about it, would be louder than the loss.
     */
    it('leaves the window standing when the lookup fails', async () => {
      mockApolloQuery.mockRejectedValue(new Error('no'))
      wrapper = mountColumn()

      await wrapper.find('[data-test="name-open"]').trigger('click')
      await flushPromises()
      await nextTick()

      expect(windowAttrs()['data-open']).toBe('true')
      expect(windowAttrs()['data-who']).toBe('id-margret')
      expect(windowAttrs()['data-bookings']).toBe('undefined')
    })
  })
})
