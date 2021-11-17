import { mount } from '@vue/test-utils'
import UserTable from './UserTable.vue'

const localVue = global.localVue

describe('UserTable', () => {
  let wrapper

  const Wrapper = () => {
    return mount(UserTable, { localVue })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('have a DIV element with the class.componente-user-table', () => {
      expect(wrapper.find('.componente-user-table').exists()).toBeTruthy()
    })
  })
})
