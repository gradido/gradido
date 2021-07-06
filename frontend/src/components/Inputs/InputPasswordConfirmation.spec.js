import { mount } from '@vue/test-utils'

import InputPasswordConfirmation from './InputPasswordConfirmation'

const localVue = global.localVue

describe('InputPasswordConfirmation', () => {
  let wrapper

  const propsData = {
    value: {
      password: '',
      passwordRepeat: '',
    },
  }

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return mount(InputPasswordConfirmation, { localVue, propsData, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has two input fields', () => {
      expect(wrapper.findAll('input')).toHaveLength(2)
    })

    describe('input values ', () => {
      it('emits input with new value for first input field', async () => {
        await wrapper.findAll('input').at(0).setValue('1234')
        expect(wrapper.emitted('input')).toBeTruthy()
        expect(wrapper.emitted('input')).toEqual([
          [
            {
              password: '1234',
              passwordRepeat: '',
            },
          ],
        ])
      })

      it('emits input with new value for second input field', async () => {
        await wrapper.findAll('input').at(1).setValue('1234')
        expect(wrapper.emitted('input')).toBeTruthy()
        expect(wrapper.emitted('input')).toEqual([
          [
            {
              password: '',
              passwordRepeat: '1234',
            },
          ],
        ])
      })
    })
  })
})
