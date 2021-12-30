import { mount } from '@vue/test-utils'
import UserTable from './UserTable.vue'

const localVue = global.localVue

describe('UserTable', () => {
  let wrapper

  const propsData = {
    type: 'Type',
    itemsUser: [],
    fieldsTable: [],
    creation: [],
  }

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return mount(UserTable, { localVue, propsData, mocks })
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
