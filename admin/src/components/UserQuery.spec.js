import { mount } from '@vue/test-utils'
import UserQuery from './UserQuery'

const localVue = global.localVue

const propsData = {
  userId: 42,
}
const mocks = {
  $t: jest.fn((t) => t),
}
describe('TransactionLinkList', () => {
  let wrapper

  const Wrapper = () => {
    return mount(UserQuery, { mocks, localVue, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has div .input-group', () => {
      expect(wrapper.find('div .input-group').exists()).toBe(true)
    })

    it('has .test-input-criteria', () => {
      expect(wrapper.find('input.test-input-criteria').exists()).toBe(true)
    })

    describe('set value', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        await wrapper.find('input.test-input-criteria').setValue('Test2')
      })

      it('emits input', () => {
        expect(wrapper.emitted('input')).toBeTruthy()
      })

      it('emits input with value "Test2"', () => {
        expect(wrapper.emitted('input')).toEqual([['Test2']])
      })
    })
  })
})
