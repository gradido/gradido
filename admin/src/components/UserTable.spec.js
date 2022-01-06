import { mount } from '@vue/test-utils'
import UserTable from './UserTable.vue'

const localVue = global.localVue

describe('UserTable', () => {
  let wrapper

  const defaultItemsUser = [
    {
      email: 'bibi@bloxberg.de',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      creation: [1000, 1000, 1000],
    },
    {
      email: 'bibi@bloxberg.de',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      creation: [1000, 1000, 1000],
    },
    {
      email: 'bibi@bloxberg.de',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      creation: [1000, 1000, 1000],
    },
  ]

  const confirmationItemsUser = [
    {
      email: 'bibi@bloxberg.de',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      amount: 10,
      memo: 'Test 1',
      date: '11-09-2001',
      moderator: 1,
    },
    {
      email: 'bibi@bloxberg.de',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      amount: 10,
      memo: 'Test 2',
      date: '21-09-2001',
      moderator: 1,
    },
    {
      email: 'bibi@bloxberg.de',
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      amount: 10,
      memo: 'Test 3',
      date: '30-09-2001',
      moderator: 1,
    },
  ]

  const propsDataPageUserSearch = {
    type: 'PageUserSearch',
    itemsUser: defaultItemsUser,
    fieldsTable: ['email', 'firstName', 'lastName', 'creation'],
  }

  const propsDataUserListSearch = {
    type: 'UserListSearch',
    itemsUser: defaultItemsUser,
    fieldsTable: ['email', 'firstName', 'lastName', 'creation'],
    creation: [1000, 1000, 1000],
  }

  const propsDataUserListMassCreation = {
    type: 'UserListMassCreation',
    itemsUser: defaultItemsUser,
    fieldsTable: ['email', 'firstName', 'lastName', 'creation'],
    creation: [1000, 1000, 1000],
  }

  const propsDataPageCreationConfirm = {
    type: 'PageCreationConfirm',
    itemsUser: confirmationItemsUser,
    fieldsTable: ['email', 'firstName', 'lastName', 'amount', 'memo', 'date', 'moderator'],
  }

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = (propsData) => {
    return mount(UserTable, { localVue, propsData, mocks })
  }

  describe('mount', () => {
    describe('type PageUserSearch', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataPageUserSearch)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })

      it('expect(wrapper.html()).', () => {
        // eslint-disable-next-line no-console
        console.log(wrapper.html())
      })
    })

    describe('type UserListSearch', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataUserListSearch)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })

      it('expect(wrapper.html()).', () => {
        // eslint-disable-next-line no-console
        console.log(wrapper.html())
      })
    })

    describe('type UserListMassCreation', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataUserListMassCreation)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })

      it('expect(wrapper.html()).', () => {
        // eslint-disable-next-line no-console
        console.log(wrapper.html())
      })
    })

    describe('type PageCreationConfirm', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataPageCreationConfirm)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })

      it('expect(wrapper.html()).', () => {
        // eslint-disable-next-line no-console
        console.log(wrapper.html())
      })
    })
    /** 
    <user-table
      v-if="itemsList.length > 0"
      type="UserListSearch"
      :itemsUser="itemsList"
      :fieldsTable="Searchfields"
      :criteria="criteria"
      :creation="creation"
      @update-item="updateItem"
    /> 
    
    <user-table
      v-show="itemsMassCreation.length > 0"
      class="shadow p-3 mb-5 bg-white rounded"
      type="UserListMassCreation"
      :itemsUser="itemsMassCreation"
      :fieldsTable="fields"
      :criteria="null"
      :creation="creation"
      @update-item="updateItem"
    />
    
    <user-table
      class="mt-4"
      type="PageCreationConfirm"
      :itemsUser="confirmResult"
      :fieldsTable="fields"
      @remove-confirm-result="removeConfirmResult"
    />

    <user-table
      type="PageUserSearch"
      :itemsUser="searchResult"
      :fieldsTable="fields"
      :criteria="criteria"
    />
    */
  })
})
