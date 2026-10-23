import { DefaultApolloClient } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import { BTable } from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { forgetModeratorContacts } from '@/composables/useModeratorContacts'
import { contactRefs } from '@/graphql/contactRefs'
import { adminStore } from '../../../test/adminStore'
import { MemberWalletLink } from '../MemberWalletLink'
import { SearchUserTable } from './SearchUserTable'

vi.mock('../CreationFormular', () => ({
  CreationFormular: {
    template:
      '<div class="component-creation-formular"><button @click="emitUpdateUserData">Update User Data</button></div>',
    methods: {
      emitUpdateUserData() {
        this.$emit('update-user-data', this.item, [250, 500, 750])
      },
    },
    props: ['item'],
  },
}))
vi.mock('../ConfirmRegisterMailFormular', () => ({
  ConfirmRegisterMailFormular: {
    template: '<div class="confirm-register-mail-formular"><slot></slot></div>',
  },
}))
vi.mock('../CreationTransactionList', () => ({
  CreationTransactionList: {
    template: '<div class="creation-transaction-list"><slot></slot></div>',
  },
}))
vi.mock('../TransactionLinkList', () => ({
  TransactionLinkList: {
    template: '<div class="transaction-link-list"><slot></slot></div>',
  },
}))
vi.mock('../ChangeUserRoleFormular', () => ({
  ChangeUserRoleFormular: {
    // Shows the role of the row it is handed, as the real form reads it from there.
    template:
      '<div class="change-user-role-formular" :data-role="String(item.role)"><button @click="emitUpdateRole">Update Role</button></div>',
    props: ['item'],
    methods: {
      emitUpdateRole() {
        this.$emit('update-role', { userId: 1, role: 'ADMIN' })
      },
    },
  },
}))
vi.mock('../DeletedUserFormular', () => ({
  DeletedUserFormular: {
    template:
      '<div class="deleted-user-formular"><button @click="emitUpdateDeletedAt">Update Deleted At</button></div>',
    methods: {
      emitUpdateDeletedAt() {
        this.$emit('update-deleted-at', { userId: 1, deletedAt: new Date() })
      },
    },
  },
}))

const propsData = {
  items: [
    {
      userId: 1,
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      email: 'bibi@bloxberg.de',
      creation: [200, 400, 600],
      emailChecked: true,
      role: null,
    },
    {
      userId: 2,
      firstName: 'Benjamin',
      lastName: 'Blümchen',
      email: 'benjamin@bluemchen.de',
      creation: [1000, 1000, 1000],
      emailChecked: true,
      role: null,
    },
    {
      userId: 3,
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'peter@lustig.de',
      creation: [0, 0, 0],
      emailChecked: true,
      role: 'ADMIN',
    },
    {
      userId: 4,
      firstName: 'New',
      lastName: 'User',
      email: 'new@user.ch',
      creation: [1000, 1000, 1000],
      emailChecked: false,
      role: null,
    },
  ],
  fields: [
    { key: 'email', label: 'e_mail' },
    { key: 'firstName', label: 'firstname' },
    { key: 'lastName', label: 'lastname' },
    {
      key: 'creation',
      label: 'creationLabel',
      formatter: (value) => value.join(' | '),
    },
    { key: 'status', label: 'status' },
  ],
}

describe('SearchUserTable', () => {
  let wrapper
  // Whom the server names as contacts of the moderator (MemberWalletLink asks, once per page).
  let contactsOfTheModerator

  const createWrapper = (props = propsData) => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      // The two dates the table writes, in the forms the admin gives English (i18n.ts).
      datetimeFormats: {
        en: {
          short: { year: 'numeric', month: 'numeric', day: 'numeric' },
          long: {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric',
          },
        },
      },
    })

    const store = adminStore({
      token: 'valid-token',
      moderator: {
        gradidoID: 'moderator-gid',
        communityUuid: 'home',
        name: 'test moderator',
        role: 'ADMIN',
      },
    })

    return mount(SearchUserTable, {
      global: {
        components: {
          BTable,
        },
        plugins: [i18n, store],
        // A pressed pin asks the server about the sign-in, and the names ask whom the
        // moderator is in contact with (MemberWalletLink).
        provide: {
          [DefaultApolloClient]: {
            query: vi.fn(({ query }) =>
              Promise.resolve(
                query === contactRefs
                  ? { data: { contactRefs: contactsOfTheModerator } }
                  : { data: {} },
              ),
            ),
          },
        },
        stubs: {
          IPhCaretUpFill: true,
          IPhCaretDown: true,
          IBiGeoAltFill: true,
          IBiSend: true,
          IMdiChatOutline: true,
        },
      },
      props,
    })
  }

  beforeEach(() => {
    // Held beside the components: every test starts from nothing.
    forgetModeratorContacts()
    contactsOfTheModerator = []
    wrapper = createWrapper()
  })

  it('has a table with four rows', () => {
    expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
  })

  describe('show row details', () => {
    beforeEach(async () => {
      await wrapper.findAll('tbody > tr').at(1).trigger('click')
    })

    // The card of the contribution page's opened row: on a phone it gives its side margins to
    // the forms (App.css, `row-details-card`), and its surface is Bootstrap's card colour.
    it('opens into the card the phone rules know, on no fixed white ground', () => {
      const card = wrapper.find('tbody .card')
      expect(card.classes()).toEqual(
        expect.arrayContaining([
          'shadow-lg',
          'ps-3',
          'pe-3',
          'mb-5',
          'rounded',
          'row-details-card',
        ]),
      )
      expect(card.classes()).not.toContain('bg-white')
    })

    describe('isAdmin', () => {
      it('emits updateRole', async () => {
        const changeUserRoleFormular = wrapper.find('.change-user-role-formular')
        await changeUserRoleFormular.find('button').trigger('click')

        expect(wrapper.emitted('update-role')).toBeTruthy()
        expect(wrapper.emitted('update-role')[0]).toEqual([1, 'ADMIN'])
      })
    })

    describe('deleted at', () => {
      it('emits updateDeletedAt', async () => {
        const deletedUserFormular = wrapper.find('.deleted-user-formular')
        await deletedUserFormular.find('button').trigger('click')

        expect(wrapper.emitted('update-deleted-at')).toBeTruthy()
        expect(wrapper.emitted('update-deleted-at')[0][0]).toBe(1)
        expect(wrapper.emitted('update-deleted-at')[0][1]).toBeInstanceOf(Date)
      })
    })

    describe('updateUserData', () => {
      it('updates the item', async () => {
        const creationFormular = wrapper.find('.component-creation-formular')
        await creationFormular.find('button').trigger('click')

        // The creation column of the open row, through the field's formatter.
        const creationCell = wrapper.findAll('tbody > tr').at(1).findAll('td').at(3)
        expect(creationCell.text()).toBe('250 | 500 | 750')
      })
    })
  })

  // Behind the username of a member who stands on the wallet's map: one press shows them
  // there, in a window of its own. Behind it -- in its place where there is none -- the arrow
  // into the wallet's send form (MemberWalletLink). The rows as the search delivers them, with
  // the pair that names the member and the server's yes or no.
  describe('the pin or the arrow behind the username', () => {
    const COMMUNITY = '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f'
    const [bibi, benjamin, peter, newUser] = propsData.items
    const rows = [
      {
        ...bibi,
        alias: 'bibi',
        gradidoID: '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d',
        communityUuid: COMMUNITY,
        findableOnMap: true,
      },
      {
        ...benjamin,
        alias: 'benni',
        gradidoID: '2c3d4e5f-6071-4b8c-9dae-1f2a3b4c5d6e',
        communityUuid: COMMUNITY,
        findableOnMap: false,
      },
      // On the map, and without a username.
      {
        ...peter,
        alias: null,
        gradidoID: '3d4e5f60-7182-4c9d-aebf-2a3b4c5d6e7f',
        communityUuid: COMMUNITY,
        findableOnMap: true,
      },
      {
        ...newUser,
        alias: null,
        gradidoID: '4e5f6071-8293-4dae-bfc0-3b4c5d6e7f80',
        communityUuid: COMMUNITY,
        findableOnMap: false,
      },
    ]
    const fields = [...propsData.fields, { key: 'alias', label: 'username' }]

    // The rows of the members: an open row brings rows of its own under it (its details).
    const memberRows = () =>
      wrapper.findAll('tbody > tr').filter((tr) => tr.findAll('td').length === fields.length)
    const usernameCell = (row) =>
      memberRows()
        .at(row)
        .findAll('td')
        .at(fields.length - 1)
    const pinIn = (row) => usernameCell(row).find('[data-test="member-map-pin"]')
    const arrowIn = (row) => usernameCell(row).find('[data-test="member-send-arrow"]')

    const bubbleIn = (row) => usernameCell(row).find('[data-test="member-chat-bubble"]')
    // An open row shows its details, with the form of the role among them.
    const rowIsOpen = () => wrapper.find('.change-user-role-formular').exists()

    beforeEach(async () => {
      wrapper = createWrapper({ items: rows, fields })
      // The names ask the server whom the moderator is in contact with; here: nobody.
      await flushPromises()
    })

    it('stands only in the rows of members who stand on the map', () => {
      expect(wrapper.findAll('[data-test="member-map-pin"]')).toHaveLength(2)
      expect(pinIn(0).exists()).toBe(true)
      expect(pinIn(1).exists()).toBe(false)
      expect(pinIn(2).exists()).toBe(true)
      expect(pinIn(3).exists()).toBe(false)
    })

    // Every member can be written to, on the map or not (Bernd, 16.10.2026: finding them and
    // writing to them are two buttons).
    it('gives every row the arrow into the send form, behind the pin where there is one', () => {
      expect(wrapper.findAll('[data-test="member-send-arrow"]')).toHaveLength(4)
      rows.forEach((_row, index) => expect(arrowIn(index).exists()).toBe(true))
      const [pin, arrow] = usernameCell(0).findAll('button')
      expect(pin.attributes('data-test')).toBe('member-map-pin')
      expect(arrow.attributes('data-test')).toBe('member-send-arrow')
    })

    // The cell itself as before: the username, and nothing where the member has none -- no
    // gradidoID stands in for it.
    it('leaves the username as it was, and the cell empty where there is none', () => {
      expect(usernameCell(0).text()).toBe('bibi')
      expect(usernameCell(1).text()).toBe('benni')
      expect(usernameCell(2).text()).toBe('')
      expect(usernameCell(3).text()).toBe('')
    })

    // ⭐ Bernd, 13.10.2026: where the member is a contact of the moderator already, the bubble
    // of the chat stands in the arrow's place and leads into the conversation with them -- on
    // the map or not (Bernd, 16.10.2026).
    describe('with a member the moderator is in contact with', () => {
      beforeEach(async () => {
        forgetModeratorContacts()
        // benni has no pin, peter stands on the map.
        contactsOfTheModerator = [rows[1], rows[2]].map(({ communityUuid, gradidoID }) => ({
          communityUuid,
          gradidoID,
        }))
        wrapper = createWrapper({ items: rows, fields })
        await flushPromises()
      })

      it('sets the bubble in the place of the arrow, in the row of the contact', () => {
        expect(bubbleIn(1).exists()).toBe(true)
        expect(arrowIn(1).exists()).toBe(false)
        expect(usernameCell(1).findAll('button')).toHaveLength(1)
      })

      it('sets the bubble in the place of the arrow behind the pin of a contact on the map', () => {
        const [pin, bubble, ...more] = usernameCell(2).findAll('button')
        expect(pin.attributes('data-test')).toBe('member-map-pin')
        expect(bubble.attributes('data-test')).toBe('member-chat-bubble')
        expect(more).toEqual([])
        expect(arrowIn(2).exists()).toBe(false)
      })

      // bibi stands on the map, the member of the last row does not; neither is a contact.
      it('leaves everybody else the arrow', () => {
        expect(wrapper.findAll('[data-test="member-chat-bubble"]')).toHaveLength(2)
        expect(arrowIn(0).exists()).toBe(true)
        expect(pinIn(0).exists()).toBe(true)
        expect(arrowIn(3).exists()).toBe(true)
        expect(bubbleIn(0).exists()).toBe(false)
        expect(bubbleIn(3).exists()).toBe(false)
      })

      it.each([
        ['in the place of the arrow', 1],
        ['behind the pin', 2],
      ])(
        'opens the conversation with the member of its row %s, and not the row',
        async (_name, row) => {
          vi.spyOn(window, 'open').mockReturnValue({ focus: vi.fn() })
          await bubbleIn(row).trigger('click')

          expect(window.open).toHaveBeenCalledTimes(1)
          const address = new URL(window.open.mock.calls[0][0])
          expect(address.searchParams.get('redirect')).toBe(
            `/contacts?with=${rows[row].gradidoID}&community=${COMMUNITY}`,
          )
          expect(rowIsOpen()).toBe(false)
          vi.restoreAllMocks()
        },
      )

      it('still opens the map with the pin of a contact', async () => {
        vi.spyOn(window, 'open').mockReturnValue({ focus: vi.fn() })
        await pinIn(2).trigger('click')

        const address = new URL(window.open.mock.calls[0][0])
        expect(address.searchParams.get('redirect')).toBe(
          `/matching/karte?with=${rows[2].gradidoID}&community=${COMMUNITY}`,
        )
        vi.restoreAllMocks()
      })
    })

    it('hands the pin the member of its row, named by username or else by first name', () => {
      const pins = wrapper.findAllComponents(MemberWalletLink)
      expect(pins).toHaveLength(rows.length)
      rows.forEach((row, index) => {
        expect(pins.at(index).props('member')).toMatchObject({
          gradidoID: row.gradidoID,
          communityUuid: row.communityUuid,
          findableOnMap: row.findableOnMap,
        })
      })
      expect(pins.at(0).props('name')).toBe('bibi')
      expect(pins.at(2).props('name')).toBe('Peter')
      // The rows with the arrow, named the same way.
      expect(pins.at(1).props('name')).toBe('benni')
      expect(pins.at(3).props('name')).toBe(rows[3].firstName)
    })

    describe('pressed', () => {
      beforeEach(() => {
        vi.spyOn(window, 'open').mockReturnValue({ focus: vi.fn() })
      })

      afterEach(() => {
        vi.restoreAllMocks()
      })

      it('opens the map on the member of its row', async () => {
        await pinIn(2).trigger('click')

        expect(window.open).toHaveBeenCalledTimes(1)
        const address = new URL(window.open.mock.calls[0][0])
        expect(address.searchParams.get('token')).toBe('valid-token')
        expect(address.searchParams.get('redirect')).toBe(
          `/matching/karte?with=${rows[2].gradidoID}&community=${COMMUNITY}`,
        )
      })

      it('opens the send form to the member of its row, on its tab "E-Mail senden"', async () => {
        await arrowIn(3).trigger('click')

        expect(window.open).toHaveBeenCalledTimes(1)
        const address = new URL(window.open.mock.calls[0][0])
        expect(address.searchParams.get('token')).toBe('valid-token')
        expect(address.searchParams.get('redirect')).toBe(
          `/send/${COMMUNITY}/${rows[3].gradidoID}?art=email#send-form`,
        )
      })

      // The row opens its details on a click anywhere in it -- anywhere but on a button, which
      // the table leaves alone. Measured on the real table, in both directions.
      it('does not open the row it stands in', async () => {
        await pinIn(0).trigger('click')
        await arrowIn(1).trigger('click')
        expect(rowIsOpen()).toBe(false)

        await usernameCell(0).trigger('click')
        expect(rowIsOpen()).toBe(true)
        expect(wrapper.find('.change-user-role-formular').attributes('data-role')).toBe('null')
      })
    })

    // ⛔ The table draws rows of its own -- copies of the members the page hands in. A member
    // deleted in their open row used to stay as they were on the screen until the list was asked
    // again: the page was told, and its rows are not the ones drawn. The pin or the arrow then
    // led to somebody who was gone (measured in the built admin interface, 13.10.2026).
    describe('where the member is deleted or brought back in the open row', () => {
      const DELETED = '2026-10-13T10:00:00.000Z'
      const deletedIconIn = (row) => memberRows().at(row).find('.test-deleted-icon')
      // The form under the open row, as the spec replaces it: it reports what the server said.
      const formReports = (report) =>
        wrapper.findComponent('.deleted-user-formular').vm.$emit('update-deleted-at', report)

      beforeEach(async () => {
        await usernameCell(0).trigger('click')
      })

      it('takes the pin off the member who was deleted, and marks the row', async () => {
        expect(pinIn(0).exists()).toBe(true)
        expect(deletedIconIn(0).exists()).toBe(false)

        await formReports({ userId: rows[0].userId, deletedAt: DELETED })

        expect(pinIn(0).exists()).toBe(false)
        expect(arrowIn(0).exists()).toBe(false)
        expect(deletedIconIn(0).exists()).toBe(true)
      })

      it('takes the arrow off a member who was deleted', async () => {
        expect(arrowIn(1).exists()).toBe(true)

        await formReports({ userId: rows[1].userId, deletedAt: DELETED })

        expect(arrowIn(1).exists()).toBe(false)
        expect(pinIn(1).exists()).toBe(false)
      })

      it('leaves every other row as it is', async () => {
        await formReports({ userId: rows[0].userId, deletedAt: DELETED })

        expect(arrowIn(1).exists()).toBe(true)
        expect(pinIn(2).exists()).toBe(true)
        expect(arrowIn(3).exists()).toBe(true)
        expect(wrapper.findAll('.test-deleted-icon')).toHaveLength(1)
      })

      it('keeps the row open, with the way to bring the member back', async () => {
        await formReports({ userId: rows[0].userId, deletedAt: DELETED })

        expect(rowIsOpen()).toBe(true)
        expect(wrapper.findAll('.deleted-user-formular')).toHaveLength(1)
      })

      it('tells the page, as before', async () => {
        await formReports({ userId: rows[0].userId, deletedAt: DELETED })
        expect(wrapper.emitted('update-deleted-at')).toEqual([[rows[0].userId, DELETED]])
      })

      // The form that brings a member back used to report into nothing: nobody listened to it.
      // Whether the member stands on the map only the server knows, so the row shows the arrow
      // until the list is asked again.
      it('shows a member who was brought back as that: no mark, and the arrow', async () => {
        await formReports({ userId: rows[0].userId, deletedAt: DELETED })
        await formReports({ userId: rows[0].userId, deletedAt: null })

        expect(deletedIconIn(0).exists()).toBe(false)
        expect(arrowIn(0).exists()).toBe(true)
        expect(pinIn(0).exists()).toBe(false)
        expect(wrapper.emitted('update-deleted-at')).toEqual([
          [rows[0].userId, DELETED],
          [rows[0].userId, null],
        ])
      })

      it('does not trip over a member who is not among its rows', async () => {
        await formReports({ userId: 4711, deletedAt: DELETED })

        expect(wrapper.findAll('.test-deleted-icon')).toHaveLength(0)
        expect(wrapper.emitted('update-deleted-at')).toEqual([[4711, DELETED]])
      })
    })

    // The form of the role keeps what it shows by itself, but only while the row is open: opened
    // again it reads the role off the row.
    it('notes a new role in its own row, and tells the page', async () => {
      await usernameCell(0).trigger('click')
      const form = () => wrapper.find('.change-user-role-formular')
      expect(form().attributes('data-role')).toBe('null')

      await form().find('button').trigger('click')

      expect(form().attributes('data-role')).toBe('ADMIN')
      expect(wrapper.emitted('update-role')).toEqual([[1, 'ADMIN']])
    })
  })

  // A member as the search delivers them, with everything the card and the seven columns read.
  const COMMUNITY = '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f'
  const member = (overrides = {}) => ({
    userId: 7,
    firstName: 'Carla',
    lastName: 'Sonne',
    alias: 'carla-sonne',
    email: 'carla.sonne@example.org',
    creation: [1000, 850, 400],
    createdAt: '2025-03-12T10:00:00.000Z',
    emailChecked: true,
    hasElopage: true,
    deletedAt: null,
    role: null,
    gradidoID: '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d',
    communityUuid: COMMUNITY,
    findableOnMap: true,
    ...overrides,
  })
  const DELETED_AT = '2026-01-15T09:00:00.000Z'
  const NBSP = '\u00a0'
  const rowIsOpen = () => wrapper.find('.change-user-role-formular').exists()

  // Below 992px UserSearch hands the table one field, `memberCard`: every member is a card that
  // says what the seven columns say, a line each (Bernd, 23.10.2026, AO-002).
  describe('the card of a member on a phone', () => {
    const MONTHS = ['Aug', 'Sep', 'Oct']
    const showCards = async (items) => {
      wrapper = createWrapper({
        items,
        fields: [{ key: 'memberCard', label: '' }],
        creationMonths: MONTHS,
      })
      await flushPromises()
    }
    const cards = () => wrapper.findAll('.member-card')
    // The lines of a card below its head, as text.
    const linesBelowHead = (card) =>
      Array.from(card.element.children)
        .slice(1)
        .map((line) => line.textContent.trim())
    const fold = (index) => cards().at(index).find('button.phone-icon-btn')

    it('the card shows the name, the username with the way into the wallet, the address, the registration date and the three months', async () => {
      await showCards([member()])
      const card = cards().at(0)

      expect(card.find('.fw-semibold').text()).toBe('Carla Sonne')
      const usernameLine = card.find('small')
      expect(usernameLine.text()).toBe('carla-sonne')
      expect(usernameLine.find('[data-test="member-map-pin"]').exists()).toBe(true)
      expect(usernameLine.find('[data-test="member-send-arrow"]').exists()).toBe(true)
      expect(usernameLine.findComponent(MemberWalletLink).props('member')).toMatchObject({
        gradidoID: member().gradidoID,
        communityUuid: COMMUNITY,
      })
      expect(linesBelowHead(card)).toEqual([
        'carla.sonne@example.org',
        'registered_at 3/12/2025',
        // A month keeps its amount on its line: a protected space between them.
        `creation: Aug${NBSP}1000 · Sep${NBSP}850 · Oct${NBSP}400`,
        'enabled',
      ])
      // A long address and a long name break inside the card instead of widening it.
      expect(card.element.children[1].classList).toContain('text-break')
      expect(card.find('.fw-semibold').classes()).toContain('text-break')
    })

    it('a member without a name is named by their username', async () => {
      await showCards([member({ firstName: '', lastName: null })])
      expect(cards().at(0).find('.fw-semibold').text()).toBe('carla-sonne')
    })

    it('the card names the status in words: active, deleted, e-mail not confirmed, no Elopage purchase', async () => {
      await showCards([
        member({ userId: 1 }),
        // Deleted says it all: the other two are not named beside it.
        member({ userId: 2, deletedAt: DELETED_AT, emailChecked: false, hasElopage: false }),
        member({ userId: 3, emailChecked: false }),
        member({ userId: 4, hasElopage: false }),
        member({ userId: 5, emailChecked: false, hasElopage: false }),
      ])
      const badges = (index) =>
        cards()
          .at(index)
          .findAll('.badge')
          .map((badge) => [
            badge.text(),
            badge.classes().find((name) => name.startsWith('text-bg-')),
          ])

      expect(badges(0)).toEqual([['enabled', 'text-bg-success']])
      expect(badges(1)).toEqual([['deleted', 'text-bg-danger']])
      expect(badges(2)).toEqual([['userStatus.emailUnconfirmed', 'text-bg-warning']])
      expect(badges(3)).toEqual([['userStatus.noElopage', 'text-bg-secondary']])
      expect(badges(4)).toEqual([
        ['userStatus.emailUnconfirmed', 'text-bg-warning'],
        ['userStatus.noElopage', 'text-bg-secondary'],
      ])
    })

    // The button opens its row itself -- once: had the table taken the press as well, the row
    // would have opened and closed again.
    it('the fold button opens and closes the row and says which it does', async () => {
      await showCards([member({ userId: 1 }), member({ userId: 2 })])
      expect(fold(1).attributes('aria-expanded')).toBe('false')
      expect(fold(1).attributes('aria-label')).toBe('show_details')
      expect(fold(1).attributes('title')).toBe('show_details')

      await fold(1).trigger('click')

      expect(rowIsOpen()).toBe(true)
      // The details stand under the card that was pressed, the second (the table puts a hidden
      // row of its own between them, for the stripes).
      const rows = wrapper.findAll('tbody > tr').map((row) => row.element)
      const second = rows.indexOf(cards().at(1).element.closest('tr'))
      expect(second).toBe(1)
      expect(
        rows.findIndex((row) => row.querySelector('.change-user-role-formular')),
      ).toBeGreaterThan(second)
      expect(fold(1).attributes('aria-expanded')).toBe('true')
      expect(fold(1).attributes('aria-label')).toBe('hide_details')
      expect(fold(1).attributes('title')).toBe('hide_details')
      expect(fold(0).attributes('aria-expanded')).toBe('false')

      await fold(1).trigger('click')

      expect(rowIsOpen()).toBe(false)
      expect(fold(1).attributes('aria-expanded')).toBe('false')
      expect(fold(1).attributes('aria-label')).toBe('show_details')
    })

    // ⛔ A real press reaches the row only after Vue has drawn the other symbol: a browser runs
    // the page's queued work between two listeners of the press (measured in the built bundle,
    // 23.10.2026). Its target, the symbol of before, is out of the page by then, and the table
    // took the press for one on the row and closed it again. A click sent by a test reaches the
    // row before any drawing, so a listener on the cell stands in for it here.
    it('keeps the press to itself, so that the symbol drawn anew does not close the row again', async () => {
      await showCards([member()])
      cards()
        .at(0)
        .element.closest('td')
        .addEventListener('click', (event) => event.target.remove())
      const symbol = fold(0).element.firstElementChild
      expect(symbol).not.toBeNull()

      symbol.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await flushPromises()

      expect(rowIsOpen()).toBe(true)
      expect(fold(0).attributes('aria-expanded')).toBe('true')
    })

    it('opens the row on a press anywhere else in the card, as at the desk', async () => {
      await showCards([member()])
      await cards().at(0).trigger('click')
      expect(rowIsOpen()).toBe(true)
      expect(fold(0).attributes('aria-expanded')).toBe('true')
    })
  })

  describe('at the desk', () => {
    // The seven columns as UserSearch hands them.
    const SEVEN = [
      { key: 'email', label: 'e_mail' },
      { key: 'firstName', label: 'firstname' },
      { key: 'lastName', label: 'lastname' },
      { key: 'alias', label: 'username', tdClass: 'text-break' },
      { key: 'creation', label: 'creationLabel', formatter: (value) => value.join(' | ') },
      { key: 'createdAt', label: 'registered_at' },
      { key: 'status', label: 'status' },
    ]
    const cellsOf = (row) => wrapper.findAll('tbody > tr').at(row).findAll('td')

    it('the desk cells render as before', async () => {
      wrapper = createWrapper({ items: [member()], fields: SEVEN })
      await flushPromises()
      const cells = cellsOf(0)

      expect(cells).toHaveLength(7)
      expect(cells.slice(0, 5).map((cell) => cell.text())).toEqual([
        'carla.sonne@example.org',
        'Carla',
        'Sonne',
        'carla-sonne',
        '1000 | 850 | 400',
      ])
      expect(cells[3].find('[data-test="member-map-pin"]').exists()).toBe(true)
      expect(cells[5].text()).toMatch(/March 12, 2025/)
      // An active member: no symbol, no word, the arrow alone.
      expect(cells[6].text()).toBe('')
      expect(wrapper.find('.member-card').exists()).toBe(false)
    })

    // The arrow asked for a value the table never hands it and pointed down on an open row too.
    it('points the arrow up while the row is open, and down again when it closes', async () => {
      wrapper = createWrapper({ items: [member()], fields: SEVEN })
      await flushPromises()
      const arrow = () => cellsOf(0).at(6).find('[data-test^="row-caret"]').attributes('data-test')
      expect(arrow()).toBe('row-caret-down')

      await wrapper.findAll('tbody > tr').at(0).trigger('click')
      expect(wrapper.find('.change-user-role-formular').exists()).toBe(true)
      expect(arrow()).toBe('row-caret-up')

      await wrapper.findAll('tbody > tr').at(0).trigger('click')
      expect(wrapper.find('.change-user-role-formular').exists()).toBe(false)
      expect(arrow()).toBe('row-caret-down')
    })

    it('at the desk every status symbol carries its word and the arrow carries no title', async () => {
      wrapper = createWrapper({
        items: [
          member({ userId: 1, deletedAt: DELETED_AT }),
          member({ userId: 2, emailChecked: false, hasElopage: false }),
        ],
        fields: [{ key: 'status', label: 'status' }],
      })
      await flushPromises()
      // Each word stands right behind its symbol.
      const words = (row) =>
        cellsOf(row)
          .at(0)
          .findAll('small')
          .map((word) => [word.text(), word.element.previousElementSibling?.tagName])

      expect(words(0)).toEqual([['deleted', 'DIV']])
      expect(cellsOf(0).at(0).find('small').element.previousElementSibling.classList).toContain(
        'test-deleted-icon',
      )
      expect(words(1)).toEqual([
        ['userStatus.emailUnconfirmed', 'DIV'],
        ['userStatus.noElopage', 'IMG'],
      ])
      // The words stand from 1200px on (narrower, the table grew and reached past the window
      // with them), and a screen reader hears them from the symbols on every width: the word
      // beside a symbol is hidden from it, its `alt` names the state.
      const all = [0, 1].flatMap((row) => cellsOf(row).at(0).findAll('small'))
      for (const word of all) {
        expect(word.classes()).toEqual(expect.arrayContaining(['d-none', 'd-xl-inline']))
        expect(word.attributes('aria-hidden')).toBe('true')
      }
      const alts = (row) =>
        cellsOf(row)
          .at(0)
          .findAll('img')
          .map((image) => image.attributes('alt'))
      // The deleted symbol is two pictures; one names it.
      expect(alts(0)).toEqual(['deleted', ''])
      expect(alts(1)).toEqual(['userStatus.emailUnconfirmed', 'userStatus.noElopage'])
      for (const row of [0, 1]) {
        const cell = cellsOf(row).at(0)
        // The arrow read `enabled`, which the search never delivers, and called every member
        // deleted. It names nothing now and is no stop for a screen reader.
        expect(cell.find('[title]').exists()).toBe(false)
        expect(cell.find('svg, [aria-hidden="true"]:not(small)').attributes('aria-hidden')).toBe(
          'true',
        )
      }
    })
  })
})
