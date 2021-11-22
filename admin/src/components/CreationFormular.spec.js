import { mount } from '@vue/test-utils'
import CreationFormular from './CreationFormular.vue'

const localVue = global.localVue
<<<<<<< HEAD

const mocks = {
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

const propsData = {
  type: '',
  item: {},
  creation: {},
  itemsMassCreation: {},
}
=======
const propsData = {
  type: 'STRING',
  creation: [100, 500, 1000],
  itemUser: [],
}
const mocks = { $moment: jest.fn() }
>>>>>>> ddaaab9c (add Tests, CreationFormular.spec.js, NavBar.spec.js, UserTable.spec.js)

describe('CreationFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CreationFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-creation-formular', () => {
      expect(wrapper.find('.component-creation-formular').exists()).toBeTruthy()
    })
  })
})
