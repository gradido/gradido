// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import GddTransaction from './GddTransaction.vue'
import { forgetAllMemberAvatars, rememberMemberAvatars } from '@/composables/useMemberAvatars'

/**
 * The row every booking in the wallet is drawn with.
 *
 * ⛔ Written because it had no test at all, while three dead neighbours that nothing
 * imported had one each. Those are gone now; this is the row that actually reaches a
 * screen, so this is where the marker under the amount has to be held.
 */

vi.mock('vuex', () => ({
  useStore: () => ({ state: { firstName: 'Max', lastName: 'Mustermann' } }),
}))

// ⚠️ The values are carried into the answer rather than dropped. A mock that returns the
// bare key cannot tell "labelled with this member's name" from "labelled with nobody's",
// and the label on the zoom button is exactly what says which face is about to open.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

// ⚠️ The zoom composable builds its labels through `i18n.global.t`, because a composable is
// not a setup scope. This file replaces the whole `vue-i18n` module, so `@/i18n` would find
// no `createI18n` to call -- mocked here rather than widened above, so the vue-i18n stub
// keeps saying only what this component asks of it.
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
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
  // The shape the booking fragment delivers: an alias and the server's colour digit, no
  // real name (NU-019).
  linkedUser: { alias: 'napoli', avatarColorIndex: 3 },
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
          // ⚠️ Emitting, not `true`. An auto-stub renders nothing and raises nothing, so
          // the one line this row contributes to the chain below could not be reached.
          Name: {
            props: ['linkedUser'],
            emits: ['open'],
            template: '<button data-test="name-open" @click="$emit(\'open\', linkedUser)" />',
          },
          CollapseIcon: true,
          DecayInformation: true,
          VariantIcon: { props: ['icon'], template: '<i :data-icon="icon" />' },
          FavoriteHeart: { props: ['member'], template: '<i data-test="heart-stub" />' },
        },
      },
    })
    return wrapper
  }

  const marker = () => wrapper.find('[data-test="transaction-via-card"]')

  /**
   * ⛔ This row's link in the chain from a tapped name to the contact window: `Name` says
   * WHO, this row passes it to whoever owns the list (KF-010).
   *
   * ⚠️ Written because deleting the binding left all 2231 tests of this suite green. It is
   * a wiring line, not behaviour -- the kind both neighbouring specs presuppose, one by
   * stubbing this row away and one by stubbing the name away.
   */
  it('hands a tapped member up to the list', async () => {
    mountWith({})

    await wrapper.find('[data-test="name-open"]').trigger('click')

    expect(wrapper.emitted('open-member')).toHaveLength(1)
    // The member the row was drawing, not one assembled a second time here.
    expect(wrapper.emitted('open-member')[0][0]).toEqual(BOOKING.linkedUser)
  })

  // A creation row names the COMMUNITY, not a member, and renders no `Name` at all -- so
  // there is nobody to open a window about and nothing to hand up.
  it('offers no member to open on a creation row', () => {
    mountWith({ typeId: 'CREATION', linkedUser: { alias: 'Gradido-Akademie' } })

    expect(wrapper.find('[data-test="name-open"]').exists()).toBe(false)
  })

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
    // It travels as the server's finished digit now (NU-017), because the real initials
    // it is hashed from are no longer delivered to this browser.
    it('keeps colouring from what the server computed, not from the alias', () => {
      mountWith({})
      expect(avatarProps().colorIndex).toBe(3)
      expect(avatarProps().colorSeed).toBe('')
      expect(avatarProps().colorSeed).not.toBe(avatarProps().initials)
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

    /**
     * Tapping the circle opens the picture at full size (AS-018).
     *
     * The three cases are the same fixture with ONE thing different each time, because the
     * rule is one line: a circle is zoomable exactly when it has a picture. Assert only
     * "zoomable when there is a picture" and the guard could be gone entirely.
     */
    describe('opening the picture at full size', () => {
      const WHEN = '2026-08-19T09:00:00.000Z'
      const withPicture = () => {
        rememberMemberAvatars([
          {
            gradidoID: 'g-napoli',
            communityUuid: null,
            avatar: 'the-picture',
            avatarUpdatedAt: WHEN,
          },
        ])
        mountWith({
          linkedUser: { ...BOOKING.linkedUser, gradidoID: 'g-napoli', avatarUpdatedAt: WHEN },
        })
      }

      it('offers the picture when the wallet holds one', () => {
        withPicture()
        expect(avatarProps().zoomable).toBe(true)
      })

      // ⛔ The circle showing letters must not offer to enlarge them. Same booking, same
      // member, no stored picture -- so a green here cannot be about anything else.
      it('offers nothing when the circle is showing letters', () => {
        mountWith({
          linkedUser: { ...BOOKING.linkedUser, gradidoID: 'g-napoli', avatarUpdatedAt: WHEN },
        })
        expect(avatarProps().src).toBe('')
        expect(avatarProps().zoomable).toBeFalsy()
      })

      // The alias, because that is the word printed beside the circle. Announcing the
      // gradido id, or the community's name, would name somebody the member cannot see on
      // the row. The mock carries the interpolation values through, so this really does
      // read the name and not just the key.
      it('says whose picture it is', () => {
        withPicture()
        expect(avatarProps().zoomLabel).toContain('avatar.zoom-open')
        expect(avatarProps().zoomLabel).toContain('napoli')
      })
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

  /**
   * The heart sits exactly where the name is a link (KF-005): a counterparty with a
   * gradidoID. A creation has none and gets none; a link or card booking has one on both
   * sides, like any transfer (KF-011).
   */
  describe('the heart', () => {
    const heart = () => wrapper.find('[data-test="heart-stub"]')

    it('is there for a transfer with a counterparty', () => {
      mountWith({ linkedUser: { alias: 'napoli', gradidoID: 'u-1', avatarColorIndex: 3 } })
      expect(heart().exists()).toBe(true)
    })

    it('is there for a booking that came through a link, and one made with a card', () => {
      mountWith({ linkId: 42, linkedUser: { alias: 'napoli', gradidoID: 'u-1' } })
      expect(heart().exists()).toBe(true)
      mountWith({ viaThankYouCard: true, linkedUser: { alias: 'napoli', gradidoID: 'u-1' } })
      expect(heart().exists()).toBe(true)
    })

    it('is not there for a creation', () => {
      mountWith({
        typeId: 'CREATION',
        linkedUser: { alias: 'Gradido Akademie', gradidoID: 'community', avatarColorIndex: 0 },
      })
      expect(heart().exists()).toBe(false)
    })

    it('is not there when the counterparty could not be resolved', () => {
      mountWith({ linkedUser: { alias: 'napoli' } })
      expect(heart().exists()).toBe(false)
    })

    /**
     * ⛔ WHERE it stands, which nothing measured while it stood in the wrong place. Beside
     * the collapse arrow at the row's end it read as a mark on the BOOKING -- and a booking
     * cannot be a favourite. It is a mark on the person, so it stands beside the person's
     * name (Bernd, 04.09.2026).
     *
     * ⚠️ Written as a structural claim rather than a visual one, because jsdom does no
     * layout: what it can say is which element the heart is a sibling of, and that is
     * exactly what went wrong. The widths behind the change were measured in a browser
     * against the built Bootstrap, not here.
     */
    it('stands beside the name, not beside the collapse arrow', () => {
      mountWith({ linkedUser: { alias: 'napoli', gradidoID: 'u-1' } })

      const heartEl = heart().element
      const nameEl = wrapper.find('[data-test="name-open"]').element
      const arrow = wrapper.find('collapse-icon-stub')

      // The arrow is still drawn -- otherwise "not beside the arrow" would be true for the
      // uninteresting reason that there is no arrow.
      expect(arrow.exists()).toBe(true)
      expect(heartEl.parentElement).toBe(nameEl.parentElement)
      expect(heartEl.parentElement.contains(arrow.element)).toBe(false)
    })

    /**
     * The column the two of them share has to be allowed to shrink, or the name -- one
     * unbreakable run -- sets the row's floor and pushes the amount and the arrow off the
     * line. Same guard and same class name as `ContactRow` and the bookings column.
     */
    it('lets the column holding name and heart give way', () => {
      mountWith({ linkedUser: { alias: 'napoli', gradidoID: 'u-1' } })

      const nameLine = wrapper.find('[data-test="name-open"]').element.parentElement
      expect(nameLine.parentElement.className).toContain('min-w-0')
    })
  })
})
