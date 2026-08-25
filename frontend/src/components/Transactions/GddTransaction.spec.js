// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import GddTransaction from './GddTransaction.vue'
import { avatarPaletteEntry } from '@/utils/avatarColor'
import { forgetAllMemberAvatars, rememberMemberAvatars } from '@/composables/useMemberAvatars'

/**
 * The row every booking in the wallet is drawn with.
 *
 * ⛔ Written because it had no test at all, while its two dead neighbours
 * (`TransactionSend.vue`, `TransactionReceive.vue`) have one each. Nothing imports those
 * two — this is the row that actually reaches a screen, so this is where the marker under
 * the amount has to be held.
 */

vi.mock('vuex', () => ({
  useStore: () => ({ state: { firstName: 'Max', lastName: 'Mustermann' } }),
}))

const BOOKING = {
  id: 7,
  typeId: 'SEND',
  amount: '-12.5',
  balance: '100',
  previousBalance: '112.5',
  balanceDate: new Date('2026-08-19T10:31:00Z'),
  memo: 'Pizzeria Napoli',
  decay: { decay: '0', start: null, end: null, duration: 0 },
  linkedUser: { firstName: 'Pizzeria', lastName: 'Napoli', alias: 'napoli' },
  linkId: null,
  viaThankYouCard: false,
  thankYouCardLabel: null,
}

describe('GddTransaction', () => {
  let wrapper

  const mountWith = (extra) => {
    wrapper = mount(GddTransaction, {
      props: { transaction: { ...BOOKING, ...extra } },
      global: {
        mocks: { $t: (key) => key, $d: (d) => String(d), $filters: { GDD: (a) => String(a) } },
        stubs: {
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
          BCollapse: { template: '<div><slot /></div>' },
          BAvatar: true,
          AppAvatar: true,
          Name: true,
          CollapseIcon: true,
          DecayInformation: true,
          VariantIcon: { props: ['icon'], template: '<i :data-icon="icon" />' },
        },
      },
    })
    return wrapper
  }

  const marker = () => wrapper.find('[data-test="transaction-via-card"]')

  afterEach(() => {
    wrapper?.unmount()
  })

  it('says nothing under the amount for a plain transfer', () => {
    mountWith({})

    expect(marker().exists()).toBe(false)
    expect(wrapper.text()).not.toContain('via_link')
  })

  it('keeps saying "via a link" for a booking that came from one', () => {
    mountWith({ linkId: 42 })

    expect(wrapper.text()).toContain('via_link')
    expect(marker().exists()).toBe(false)
  })

  /**
   * The payer's own row. The name is the answer to "which of my cards was that?" for
   * somebody who has printed more than one over the years.
   */
  it('names the card on the row of the member who paid with it', () => {
    mountWith({ viaThankYouCard: true, thankYouCardLabel: 'Portemonnaie' })

    expect(marker().text()).toContain('Portemonnaie')
    expect(marker().find('[data-icon="cards"]').exists()).toBe(true)
  })

  /**
   * ⛔ The till's row, and the half that had to be pinned: a card was used, and that is
   * ALL it says. The name never arrives here — the backend leaves it off this side — and
   * this test fails the moment the screen starts inventing one.
   */
  it('says only that a card was used when no name came with the booking', () => {
    mountWith({ typeId: 'RECEIVE', viaThankYouCard: true, thankYouCardLabel: null })

    expect(marker().text()).toContain('via_card')
    expect(marker().text()).not.toContain('Portemonnaie')
    expect(marker().find('[data-icon="cards"]').exists()).toBe(true)
  })

  /**
   * The creation line, and it had no test at all until now -- which is exactly how it
   * came to be read as "the moderator's alias" when it never was.
   *
   * A CREATION booking is not linked to the moderator who approved it: the backend puts
   * the community stand-in in that slot unconditionally, so the fixture here is
   * STUB-shaped -- an alias that is a community name, and no real name at all, because
   * the stand-in is not a person and has none.
   */
  describe('the creation line', () => {
    const CREATION = {
      typeId: 'CREATION',
      amount: '200',
      linkedUser: {
        alias: 'Gradido Entwicklung',
        gradidoID: '11111111-2222-4333-4444-55555555',
      },
    }

    it('names the community, not a person', () => {
      mountWith(CREATION)

      expect(wrapper.text()).toContain('Gradido Entwicklung')
    })

    it('falls back to the identifier when no name is configured', () => {
      mountWith({ ...CREATION, linkedUser: { ...CREATION.linkedUser, alias: null } })

      expect(wrapper.text()).toContain('11111111-2222-4333-4444-55555555')
    })
  })

  // A link and a card are mutually exclusive, and the link wins the branch. Pinned so that
  // adding a third marker later cannot quietly make a row show two.
  it('shows one marker at a time, never two', () => {
    mountWith({ linkId: 42, viaThankYouCard: true, thankYouCardLabel: 'Portemonnaie' })

    expect(wrapper.text()).toContain('via_link')
    expect(marker().exists()).toBe(false)
  })

  /**
   * The circle beside the booking. Tested HERE and not only where the rule lives, because
   * the rule living in one place does not make a call site pass it correctly -- the
   * letters and the colour seed are two values that have to describe the same member, and
   * the last time this house let call sites assemble such a pair, three of four were right
   * and the fourth put a raw placeholder in front of members.
   */
  describe('the avatar beside the booking', () => {
    const avatarProps = () => wrapper.findComponent({ name: 'AppAvatar' }).props()

    afterEach(() => {
      forgetAllMemberAvatars()
    })

    it('shows the first two letters of the alias, not the real initials', () => {
      mountWith({})
      expect(avatarProps().initials).toBe('NA')
    })

    // The colour must stay where it was, or every member with an alias changes colour the
    // day this ships -- and the printed card, which is not reprinted, disagrees forever.
    it('keeps colouring from the real initials', () => {
      mountWith({})
      expect(avatarProps().colorSeed).toBe('PN')
      expect(avatarPaletteEntry(avatarProps().colorSeed)).toEqual(avatarPaletteEntry('PN'))
      expect(avatarProps().colorSeed).not.toBe(avatarProps().initials)
    })

    // `username` was passed to a prop that does not exist, so it was dropped in silence.
    it('passes the name under the name the component actually has', () => {
      mountWith({})
      expect(avatarProps().name).toBe('Pizzeria Napoli')
    })

    it('shows no picture while the wallet holds none', () => {
      mountWith({})
      expect(avatarProps().src).toBe('')
    })

    it('shows the picture once the wallet holds a current one', () => {
      const when = '2026-08-19T09:00:00.000Z'
      rememberMemberAvatars([
        {
          gradidoID: 'g-napoli',
          communityUuid: null,
          avatar: 'the-picture',
          avatarUpdatedAt: when,
        },
      ])
      mountWith({
        linkedUser: { ...BOOKING.linkedUser, gradidoID: 'g-napoli', avatarUpdatedAt: when },
      })
      expect(avatarProps().src).toBe('data:image/jpeg;base64,the-picture')
    })

    // The withdrawal, seen from the row: the list stops reporting a date, so the stored
    // picture must not answer -- even though it is still lying on this device.
    it('falls back to the letters when the list reports no date', () => {
      const when = '2026-08-19T09:00:00.000Z'
      rememberMemberAvatars([
        {
          gradidoID: 'g-napoli',
          communityUuid: null,
          avatar: 'the-picture',
          avatarUpdatedAt: when,
        },
      ])
      mountWith({
        linkedUser: { ...BOOKING.linkedUser, gradidoID: 'g-napoli', avatarUpdatedAt: null },
      })
      expect(avatarProps().src).toBe('')
      expect(avatarProps().initials).toBe('NA')
    })

    /**
     * ⛔ The one condition under which this whole delivery works, and nothing measured it.
     *
     * The picture arrives a few hundred milliseconds after the list has already painted.
     * The store is a plain Map -- deliberately, it holds base64 by the hundred -- so the
     * only thing that tells a rendered row to look again is the counter `storedMemberAvatar`
     * reads. Every other test here arranges the picture BEFORE mounting, or remounts, and
     * both of those pass with that counter deleted; in the browser the member would then see
     * initials for the whole visit and never a face.
     *
     * So: the SAME wrapper, painted first, picture second.
     */
    it('replaces the letters when the picture arrives after the first paint', async () => {
      const when = '2026-08-19T09:00:00.000Z'
      mountWith({
        linkedUser: { ...BOOKING.linkedUser, gradidoID: 'g-napoli', avatarUpdatedAt: when },
      })
      expect(avatarProps().src).toBe('')

      rememberMemberAvatars([
        {
          gradidoID: 'g-napoli',
          communityUuid: null,
          avatar: 'the-picture',
          avatarUpdatedAt: when,
        },
      ])
      await nextTick()

      expect(avatarProps().src).toBe('data:image/jpeg;base64,the-picture')
    })

    /**
     * A booking whose counterparty the backend could not resolve arrives as
     * `linkedUser: null` -- the field is nullable and the resolver's if/else-if chain has no
     * final branch. A throw inside a computed during render does not degrade this row, it
     * REMOVES it: Vue substitutes a comment node, so the amount, the date and the name go
     * with the circle, and no error handler is configured to report it.
     */
    it('draws an empty circle rather than tearing the row down', () => {
      expect(() => mountWith({ linkedUser: null })).not.toThrow()
      expect(avatarProps().initials).toBe('')
      expect(avatarProps().name).toBe('')
      expect(avatarProps().src).toBe('')
    })
  })
})
