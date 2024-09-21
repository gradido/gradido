import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import FirstName from './FirstName'
import { BFormInput } from 'bootstrap-vue-next'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    n: (value) => String(value),
  }),
}))

describe('FirstName', () => {
  let wrapper

  const mocks = {
    $t: vi.fn((t) => t),
    $i18n: {
      locale: vi.fn(() => 'en'),
    },
    $n: vi.fn((n) => String(n)),
  }

  const propsData = {
    value: '',
  }

  const createWrapper = () => {
    return mount(FirstName, {
      global: {
        mocks,
        components: {
          BFormInput,
        },
      },
      props: propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.first-name').exists()).toBe(true)
    })

    it('renders the label with correct text', () => {
      expect(wrapper.find('label').text()).toBe('form.firstname')
    })

    it('updates firstName when input value changes', async () => {
      const input = wrapper.find('input')
      await input.setValue('John')
      expect(wrapper.vm.firstName).toBe('John')
    })

    it('computes firstNameState correctly', async () => {
      const input = wrapper.find('input')
      await input.setValue('Jo')
      expect(wrapper.vm.firstNameState).toBe(false)
      await input.setValue('John')
      expect(wrapper.vm.firstNameState).toBe(true)
    })
  })
})
