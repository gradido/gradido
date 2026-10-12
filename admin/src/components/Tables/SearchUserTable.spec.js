import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { DefaultApolloClient } from '@vue/apollo-composable'
import SearchUserTable from './SearchUserTable.vue'
import MemberMapPin from '../MemberMapPin.vue'
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
        // A pressed pin asks the server about the sign-in (MemberMapPin).
        provide: { [DefaultApolloClient]: { query: vi.fn().mockResolvedValue({ data: {} }) } },
        stubs: {
          IPhCaretUpFill: true,
          IPhCaretDown: true,
          IBiGeoAltFill: true,
        },
      },
      props,
    })
  }

  beforeEach(() => {
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
  // there, in a window of its own (MemberMapPin). The rows as the search delivers them, with
  // the pair that names the member and the server's yes or no.
  describe('the pin behind the username', () => {
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

    const usernameCell = (row) =>
      wrapper
        .findAll('tbody > tr')
        .at(row)
        .findAll('td')
        .at(fields.length - 1)
    const pinIn = (row) => usernameCell(row).find('[data-test="member-map-pin"]')

    beforeEach(() => {
      wrapper = createWrapper({ items: rows, fields })
    })

    it('stands only in the rows of members who stand on the map', () => {
      expect(wrapper.findAll('[data-test="member-map-pin"]')).toHaveLength(2)
      expect(pinIn(0).exists()).toBe(true)
      expect(pinIn(1).exists()).toBe(false)
      expect(pinIn(2).exists()).toBe(true)
      expect(pinIn(3).exists()).toBe(false)
    })

    // The cell itself as before: the username, and nothing where the member has none -- no
    // gradidoID stands in for it.
    it('leaves the username as it was, and the cell empty where there is none', () => {
      expect(usernameCell(0).text()).toBe('bibi')
      expect(usernameCell(1).text()).toBe('benni')
      expect(usernameCell(2).text()).toBe('')
      expect(usernameCell(3).text()).toBe('')
    })

    it('hands the pin the member of its row, named by username or else by first name', () => {
      const pins = wrapper.findAllComponents(MemberMapPin)
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

      // The row opens its details on a click anywhere in it -- anywhere but on a button, which
      // the table leaves alone. Measured on the real table, in both directions.
      it('does not open the row it stands in', async () => {
        await pinIn(0).trigger('click')
        expect(wrapper.vm.myItems.some((item) => item._showDetails)).toBe(false)

        await usernameCell(0).trigger('click')
        expect(wrapper.vm.myItems[0]._showDetails).toBe(true)
      })
    })
  })
})
