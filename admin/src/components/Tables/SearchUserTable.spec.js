import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { DefaultApolloClient } from '@vue/apollo-composable'
import SearchUserTable from './SearchUserTable.vue'
import MemberWalletLink from '../MemberWalletLink.vue'
import { contactRefs } from '@/graphql/contactRefs'
import { forgetModeratorContacts } from '@/composables/useModeratorContacts'
import { BTable } from 'bootstrap-vue-next'

vi.mock('../CreationFormular.vue', () => ({
  default: {
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
vi.mock('../ConfirmRegisterMailFormular.vue', () => ({
  default: {
    template: '<div class="confirm-register-mail-formular"><slot></slot></div>',
  },
}))
vi.mock('../CreationTransactionList.vue', () => ({
  default: {
    template: '<div class="creation-transaction-list"><slot></slot></div>',
  },
}))
vi.mock('../TransactionLinkList.vue', () => ({
  default: {
    template: '<div class="transaction-link-list"><slot></slot></div>',
  },
}))
vi.mock('../ChangeUserRoleFormular.vue', () => ({
  default: {
    template:
      '<div class="change-user-role-formular"><button @click="emitUpdateRole">Update Role</button></div>',
    methods: {
      emitUpdateRole() {
        this.$emit('updateRole', { userId: 1, role: 'ADMIN' })
      },
    },
  },
}))
vi.mock('../DeletedUserFormular.vue', () => ({
  default: {
    template:
      '<div class="deleted-user-formular"><button @click="emitUpdateDeletedAt">Update Deleted At</button></div>',
    methods: {
      emitUpdateDeletedAt() {
        this.$emit('updateDeletedAt', { userId: 1, deletedAt: new Date() })
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
    })

    const store = createStore({
      state: {
        token: 'valid-token',
        moderator: {
          id: 0,
          name: 'test moderator',
          role: 'ADMIN',
        },
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

        await wrapper.vm.$nextTick() // Wait for the next tick to ensure reactivity has updated

        expect(wrapper.vm.myItems[1].creation).toEqual([250, 500, 750])
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
          expect(wrapper.vm.myItems.some((item) => item._showDetails)).toBe(false)
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
        expect(wrapper.vm.myItems.some((item) => item._showDetails)).toBe(false)

        await usernameCell(0).trigger('click')
        expect(wrapper.vm.myItems[0]._showDetails).toBe(true)
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
        wrapper.findComponent('.deleted-user-formular').vm.$emit('updateDeletedAt', report)

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

        expect(wrapper.vm.myItems[0]._showDetails).toBe(true)
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
      expect(wrapper.vm.myItems[0].role).toBeNull()

      await wrapper.find('.change-user-role-formular button').trigger('click')

      expect(wrapper.vm.myItems[0].role).toBe('ADMIN')
      expect(wrapper.emitted('update-role')).toEqual([[1, 'ADMIN']])
    })
  })
})
