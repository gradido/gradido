import { mount } from '@vue/test-utils'
import UserTable from './UserTable.vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn()
apolloQueryMock.mockResolvedValue()

describe('UserTable', () => {
  let wrapper

  const defaultItemsUser = [
    {
      userId: 1,
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      email: 'bibi@bloxberg.de',
      creation: [200, 400, 600],
      emailChecked: true,
    },
    {
      userId: 2,
      firstName: 'Benjamin',
      lastName: 'Blümchen',
      email: 'benjamin@bluemchen.de',
      creation: [1000, 1000, 1000],
      emailChecked: true,
    },
    {
      userId: 3,
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'peter@lustig.de',
      creation: [0, 0, 0],
      emailChecked: true,
    },
    {
      userId: 4,
      firstName: 'New',
      lastName: 'User',
      email: 'new@user.ch',
      creation: [1000, 1000, 1000],
      emailChecked: false,
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
    $d: jest.fn((d) => String(d)),
    $apollo: {
      query: apolloQueryMock,
    },
    $store: {
      commit: jest.fn(),
    },
  }

  const Wrapper = (propsData) => {
    return mount(UserTable, { localVue, propsData, mocks })
  }

  describe('mount', () => {
    describe('type PageUserSearch', () => {
      beforeEach(async () => {
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
          it('has 4 rows', () => {
            expect(wrapper.findAll('tbody tr')).toHaveLength(4)
          })

          it('has 7 columns', () => {
            expect(wrapper.findAll('tr:nth-child(1) > td')).toHaveLength(7)
          })

          it('find button on fifth column', () => {
            expect(
              wrapper.findAll('tr:nth-child(1) > td').at(5).find('button').isVisible(),
            ).toBeTruthy()
          })
        })

        describe('row toggling', () => {
          describe('user with email not activated', () => {
            it('has no details button', () => {
              expect(
                wrapper.findAll('tbody > tr').at(3).findAll('td').at(4).find('button').exists(),
              ).toBeFalsy()
            })

            it('has a red confirmed button with envelope item', () => {
              const row = wrapper.findAll('tbody > tr').at(3)
              expect(row.findAll('td').at(5).find('button').exists()).toBeTruthy()
              expect(row.findAll('td').at(5).find('button').classes('btn-danger')).toBeTruthy()
              expect(row.findAll('td').at(5).find('svg').classes('bi-envelope')).toBeTruthy()
            })

            describe('click on envelope', () => {
              beforeEach(async () => {
                await wrapper
                  .findAll('tbody > tr')
                  .at(3)
                  .findAll('td')
                  .at(5)
                  .find('button')
                  .trigger('click')
              })

              it('opens the details', async () => {
                expect(wrapper.findAll('tbody > tr')).toHaveLength(6)
                expect(wrapper.findAll('tbody > tr').at(5).find('input').element.value).toBe(
                  'new@user.ch',
                )
                expect(wrapper.findAll('tbody > tr').at(5).text()).toContain(
                  'unregister_mail.text_false',
                )
                // HACK: for some reason we need to close the row details after this test
                await wrapper
                  .findAll('tbody > tr')
                  .at(3)
                  .findAll('td')
                  .at(5)
                  .find('button')
                  .trigger('click')
              })

              describe('click on envelope again', () => {
                beforeEach(async () => {
                  await wrapper
                    .findAll('tbody > tr')
                    .at(3)
                    .findAll('td')
                    .at(5)
                    .find('button')
                    .trigger('click')
                })

                it('closes the details', () => {
                  expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
                })
              })

              describe('click on close details', () => {
                beforeEach(async () => {
                  await wrapper.findAll('tbody > tr').at(5).findAll('button').at(1).trigger('click')
                })

                it('closes the details', () => {
                  expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
                })
              })
            })
          })

          describe('different details', () => {
            it.skip('shows the creation formular for second user', async () => {
              await wrapper
                .findAll('tbody > tr')
                .at(1)
                .findAll('td')
                .at(4)
                .find('button')
                .trigger('click')
              expect(wrapper.findAll('tbody > tr')).toHaveLength(6)
              expect(
                wrapper
                  .findAll('tbody > tr')
                  .at(3)
                  .find('div.component-creation-formular')
                  .exists(),
              ).toBeTruthy()
            })

            it.skip('shows the transactions for third user', async () => {
              await wrapper
                .findAll('tbody > tr')
                .at(4)
                .findAll('td')
                .at(6)
                .find('button')
                .trigger('click')
              expect(wrapper.findAll('tbody > tr')).toHaveLength(6)
            })
          })
        })
      })
    })

    describe('type UserListSearch', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataUserListSearch)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })
    })

    describe('type UserListMassCreation', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataUserListMassCreation)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })
    })

    describe('type PageCreationConfirm', () => {
      beforeEach(() => {
        wrapper = Wrapper(propsDataPageCreationConfirm)
      })

      it('has a DIV element with the class.component-user-table', () => {
        expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
      })
    })
  })
})
