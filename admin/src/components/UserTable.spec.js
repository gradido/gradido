import { mount } from '@vue/test-utils'
import UserTable from './UserTable.vue'

const localVue = global.localVue

describe('UserTable', () => {
  let wrapper

  const propsData = {
<<<<<<< HEAD
    type: 'Type',
    itemsUser: [],
    fieldsTable: [],
    creation: {},
=======
    type: 'TableName',
    itemUser: [
      {
        id: 1,
        email: 'dickerson@web.de',
        first_name: 'Dickerson',
        last_name: 'Macdonald',
        creation: '450,200,700',
      },
    ],
    creation: [null, null, null],
>>>>>>> ddaaab9c (add Tests, CreationFormular.spec.js, NavBar.spec.js, UserTable.spec.js)
  }

  const Wrapper = () => {
    return mount(UserTable, { localVue, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-user-table', () => {
      expect(wrapper.find('.component-user-table').exists()).toBeTruthy()
    })
  })
})
