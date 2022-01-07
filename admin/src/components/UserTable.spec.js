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
    fieldsTable: [
      'email',
      'firstName',
      'lastName',
      'creation',
      'show_details',
      'confirm_mail',
      'transactions_list',
    ],
  }

  const propsDataUserListSearch = {
    type: 'UserListSearch',
    itemsUser: defaultItemsUser,
    fieldsTable: ['bookmark', 'email', 'firstName', 'lastName', 'creation'],
    creation: [1000, 1000, 1000],
  }

  const propsDataUserListMassCreation = {
    type: 'UserListMassCreation',
    itemsUser: defaultItemsUser,
    fieldsTable: ['email', 'firstName', 'lastName', 'creation', 'bookmark'],
    creation: [1000, 1000, 1000],
  }

  const propsDataPageCreationConfirm = {
    type: 'PageCreationConfirm',
    itemsUser: confirmationItemsUser,
    fieldsTable: [
      'bookmark',
      'email',
      'firstName',
      'lastName',
      'amount',
      'memo',
      'date',
      'moderator',
      'edit_creation',
      'confirm',
    ],
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $moment: jest.fn(() => {
      return {
        format: jest.fn((m) => m),
        subtract: jest.fn(() => {
          return {
            format: jest.fn((m) => m),
          }
        }),
      }
    }),
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

      it('has a DIV element with the id overlay that is not displayed', () => {
        expect(wrapper.find('#overlay').exists()).toBeTruthy()
        expect(wrapper.find('#overlay').attributes('style')).toBe('display: none;')
      })

      describe('table', () => {
        it('has a table', () => {
          expect(wrapper.find('table').exists()).toBeTruthy()
        })

        describe('header definition', () => {
          it('has 4 column', () => {
            expect(wrapper.findAll('th').length).toBe(7)
          })

          it('has Email as first column', () => {
            expect(wrapper.find('th[aria-colindex="1"] div').text()).toBe('Email')
          })

          it('has First Name as second column', () => {
            expect(wrapper.find('th[aria-colindex="2"] div').text()).toBe('First Name')
          })

          it('has Last Name as third column', () => {
            expect(wrapper.find('th[aria-colindex="3"] div').text()).toBe('Last Name')
          })

          it('has Creation as fourth column', () => {
            expect(wrapper.find('th[aria-colindex="4"] div').text()).toBe('Creation')
          })

          it('has Creation as fifth column', () => {
            expect(wrapper.find('th[aria-colindex="5"] div').text()).toBe('Show Details')
          })

          it('has Creation as sixth column', () => {
            expect(wrapper.find('th[aria-colindex="6"] div').text()).toBe('Confirm Mail')
          })

          it('has Creation as seventh column', () => {
            expect(wrapper.find('th[aria-colindex="7"] div').text()).toBe('Transactions List')
          })
        })

        describe('content', () => {
          it('has 3 rows', () => {
            expect(wrapper.findAll('tbody tr').length).toBe(3)
          })

          it('has 7 columns', () => {
            expect(wrapper.findAll('tr:nth-child(1) > td').length).toBe(7)
          })

          it('click button on fifth column', () => {
            wrapper.find('tbody tr td[aria-colindex="5"] button').trigger('click')
          })
        })
      })

      // it('expect(wrapper.html()).', () => {
      //   // eslint-disable-next-line no-console
      //   console.log(wrapper.html())
      // })
    })

    describe('type UserListSearch', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataUserListSearch)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })

      // it('expect(wrapper.html()).', () => {
      //   // eslint-disable-next-line no-console
      //   console.log(wrapper.html())
      // })
    })

    describe('type UserListMassCreation', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataUserListMassCreation)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })

      // it('expect(wrapper.html()).', () => {
      //   // eslint-disable-next-line no-console
      //   console.log(wrapper.html())
      // })
    })

    describe('type PageCreationConfirm', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataPageCreationConfirm)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })

      // it('expect(wrapper.html()).', () => {
      //   // eslint-disable-next-line no-console
      //   console.log(wrapper.html())
      // })
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
