import { mount } from '@vue/test-utils'
import InputUsername from './InputUsername'

const localVue = global.localVue

describe('UserName Form', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        username: '',
      },
    },
  }

  const propsData = {
    value: '',
    unique: false,
  }

  const Wrapper = () => {
    return mount(InputUsername, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })
    it('renders the component', () => {
      expect(wrapper.find('[data-test="username"]').exists()).toBeTruthy()
    })

    describe('currentValue', () => {
      beforeEach(async () => {
        wrapper = Wrapper()

        await wrapper.setProps({ value: 'petra' })
        await wrapper.find('[data-test="username"]').setValue('petra')
      })
      it('emits input event with the current value', () => {
        expect(wrapper.emitted('input')).toEqual([['petra']])
      })
    })
  })
})
