import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import SearchUserTable from './SearchUserTable.vue'
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

  const createWrapper = () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
    })

    const store = createStore({
      state: {
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
        stubs: {
          IPhCaretUpFill: true,
          IPhCaretDown: true,
        },
      },
      props: propsData,
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
})
