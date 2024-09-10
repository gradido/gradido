// import { mount } from '@vue/test-utils'
// import SearchUserTable from './SearchUserTable'
//
// const localVue = global.localVue
//
// const apolloMutateMock = jest.fn().mockResolvedValue({})
// const apolloQueryMock = jest.fn().mockResolvedValue({})
//
// const propsData = {
//   items: [
//     {
//       userId: 1,
//       firstName: 'Bibi',
//       lastName: 'Bloxberg',
//       email: 'bibi@bloxberg.de',
//       creation: [200, 400, 600],
//       emailChecked: true,
//       roles: [],
//     },
//     {
//       userId: 2,
//       firstName: 'Benjamin',
//       lastName: 'Blümchen',
//       email: 'benjamin@bluemchen.de',
//       creation: [1000, 1000, 1000],
//       emailChecked: true,
//       roles: [],
//     },
//     {
//       userId: 3,
//       firstName: 'Peter',
//       lastName: 'Lustig',
//       email: 'peter@lustig.de',
//       creation: [0, 0, 0],
//       emailChecked: true,
//       roles: ['ADMIN'],
//     },
//     {
//       userId: 4,
//       firstName: 'New',
//       lastName: 'User',
//       email: 'new@user.ch',
//       creation: [1000, 1000, 1000],
//       emailChecked: false,
//       roles: [],
//     },
//   ],
//   fields: [
//     { key: 'email', label: 'e_mail' },
//     { key: 'firstName', label: 'firstname' },
//     { key: 'lastName', label: 'lastname' },
//     {
//       key: 'creation',
//       label: 'creationLabel',
//       formatter: (value, key, item) => {
//         return value.join(' | ')
//       },
//     },
//     { key: 'status', label: 'status' },
//   ],
// }
//
// const mocks = {
//   $t: jest.fn((t) => t),
//   $d: jest.fn((d) => d),
//   $apollo: {
//     mutate: apolloMutateMock,
//     query: apolloQueryMock,
//   },
//   $store: {
//     state: {
//       moderator: {
//         id: 0,
//         name: 'test moderator',
//         roles: ['ADMIN'],
//       },
//     },
//   },
// }
//
// describe('SearchUserTable', () => {
//   let wrapper
//
//   const Wrapper = () => {
//     return mount(SearchUserTable, { localVue, mocks, propsData })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('has a table with four rows', () => {
//       expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
//     })
//
//     describe('show row details', () => {
//       beforeEach(async () => {
//         await wrapper.findAll('tbody > tr').at(1).trigger('click')
//       })
//
//       describe('isAdmin', () => {
//         beforeEach(async () => {
//           await wrapper.find('div.change-user-role-formular').vm.$emit('updateRoles', {
//             userId: 1,
//             roles: ['ADMIN'],
//           })
//         })
//
//         it('emits updateIsAdmin', () => {
//           expect(wrapper.emitted('updateRoles')).toEqual([[1, ['ADMIN']]])
//         })
//       })
//
//       describe('deleted at', () => {
//         beforeEach(async () => {
//           await wrapper.find('div.deleted-user-formular').vm.$emit('updateDeletedAt', {
//             userId: 1,
//             deletedAt: new Date(),
//           })
//         })
//
//         it('emits updateDeletedAt', () => {
//           expect(wrapper.emitted('updateDeletedAt')).toEqual([[1, expect.any(Date)]])
//         })
//       })
//
//       describe('updateUserData', () => {
//         beforeEach(async () => {
//           await wrapper
//             .find('div.component-creation-formular')
//             .vm.$emit('update-user-data', propsData.items[1], [250, 500, 750])
//         })
//
//         it('updates the item', () => {
//           expect(wrapper.vm.items[1].creation).toEqual([250, 500, 750])
//         })
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import SearchUserTable from './SearchUserTable.vue'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { BCard, BTab, BTable, BTabs } from 'bootstrap-vue-next'

// // Mock Bootstrap components
// vi.mock('bootstrap-vue-next', async () => {
//   const actual = await vi.importActual('bootstrap-vue-next')
//   return {
//     ...actual,
//     BTable: { template: '<table><slot></slot></table>' },
//     BTab: { template: '<div><slot></slot></div>' },
//     BTabs: { template: '<div><slot></slot></div>' },
//     BCard: { template: '<div><slot></slot></div>' },
//   }
// })

// Mock custom components
vi.mock('../CreationFormular.vue', () => ({
  default: {
    template: '<div class="component-creation-formular"><slot></slot></div>',
  },
}))
vi.mock('../ConfirmRegisterMailFormular.vue', () => ({
  default: {
    template: '<div></div>',
  },
}))
vi.mock('../CreationTransactionList.vue', () => ({
  default: {
    template: '<div></div>',
  },
}))
vi.mock('../TransactionLinkList.vue', () => ({
  default: {
    template: '<div></div>',
  },
}))
vi.mock('../ChangeUserRoleFormular.vue', () => ({
  default: {
    template: '<div class="change-user-role-formular"><slot></slot></div>',
  },
}))
vi.mock('../DeletedUserFormular.vue', () => ({
  default: {
    template: '<div class="deleted-user-formular"><slot></slot></div>',
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
      roles: [],
    },
    {
      userId: 2,
      firstName: 'Benjamin',
      lastName: 'Blümchen',
      email: 'benjamin@bluemchen.de',
      creation: [1000, 1000, 1000],
      emailChecked: true,
      roles: [],
    },
    {
      userId: 3,
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'peter@lustig.de',
      creation: [0, 0, 0],
      emailChecked: true,
      roles: ['ADMIN'],
    },
    {
      userId: 4,
      firstName: 'New',
      lastName: 'User',
      email: 'new@user.ch',
      creation: [1000, 1000, 1000],
      emailChecked: false,
      roles: [],
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

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      // Add your translations here
    },
  },
})

const store = createStore({
  state() {
    return {
      moderator: {
        id: 0,
        name: 'test moderator',
        roles: ['ADMIN'],
      },
    }
  },
})

describe('SearchUserTable', () => {
  let wrapper

  const createWrapper = () => {
    return mount(SearchUserTable, {
      global: {
        plugins: [i18n, store],
        stubs: {
          IPhCaretUpFill: true,
          IPhCaretDown: true,
          BTable,
          BTab,
          BTabs,
          BCard,
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

    it('emits updateRoles when change-user-role-formular emits updateRoles', async () => {
      await wrapper.find('.change-user-role-formular').vm.$emit('updateRoles', {
        userId: 1,
        roles: ['ADMIN'],
      })
      expect(wrapper.emitted('update-roles')).toEqual([[1, ['ADMIN']]])
    })

    it('emits updateDeletedAt when deleted-user-formular emits updateDeletedAt', async () => {
      const date = new Date()
      await wrapper.find('.deleted-user-formular').vm.$emit('updateDeletedAt', {
        userId: 1,
        deletedAt: date,
      })
      expect(wrapper.emitted('update-deleted-at')).toEqual([[1, date]])
    })

    it('updates the item when component-creation-formular emits update-user-data', async () => {
      await wrapper
        .find('.component-creation-formular')
        .vm.$emit('update-user-data', propsData.items[1], [250, 500, 750])
      expect(wrapper.vm.myItems[1].creation).toEqual([250, 500, 750])
    })
  })
})
