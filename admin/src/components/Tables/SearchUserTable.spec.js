import { mount } from '@vue/test-utils'
import SearchUserTable from './SearchUserTable'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const localVue = global.localVue

const apolloMutateMock = vi.fn().mockResolvedValue({})
const apolloQueryMock = vi.fn().mockResolvedValue({})

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
      formatter: (value, key, item) => {
        return value.join(' | ')
      },
    },
    { key: 'status', label: 'status' },
  ],
}

const mocks = {
  $t: vi.fn((t) => t),
  $d: vi.fn((d) => d),
  $apollo: {
    mutate: apolloMutateMock,
    query: apolloQueryMock,
  },
  $store: {
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
        roles: ['ADMIN'],
      },
    },
  },
}

describe('SearchUserTable', () => {
  let wrapper

  const Wrapper = () => {
    return mount(SearchUserTable, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a table with four rows', () => {
      expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
    })

    describe('show row details', () => {
      beforeEach(async () => {
        await wrapper.findAll('tbody > tr').at(1).trigger('click')
      })

      describe('isAdmin', () => {
        beforeEach(async () => {
          await wrapper.find('div.change-user-role-formular').vm.$emit('updateRoles', {
            userId: 1,
            roles: ['ADMIN'],
          })
        })

        it('emits updateIsAdmin', () => {
          expect(wrapper.emitted('updateRoles')).toEqual([[1, ['ADMIN']]])
        })
      })

      describe('deleted at', () => {
        beforeEach(async () => {
          await wrapper.find('div.deleted-user-formular').vm.$emit('updateDeletedAt', {
            userId: 1,
            deletedAt: new Date(),
          })
        })

        it('emits updateDeletedAt', () => {
          expect(wrapper.emitted('updateDeletedAt')).toEqual([[1, expect.any(Date)]])
        })
      })

      describe('updateUserData', () => {
        beforeEach(async () => {
          await wrapper
            .find('div.component-creation-formular')
            .vm.$emit('update-user-data', propsData.items[1], [250, 500, 750])
        })

        it('updates the item', () => {
          expect(wrapper.vm.items[1].creation).toEqual([250, 500, 750])
        })
      })
    })
  })
})
