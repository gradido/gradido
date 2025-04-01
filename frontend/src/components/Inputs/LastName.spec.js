import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import LastName from './LastName'
import { BFormInput } from 'bootstrap-vue-next'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    n: (n) => String(n),
  }),
}))

describe('LastName', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(LastName, {
      props: {
        value: '',
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
          $i18n: {
            locale: 'en',
          },
          $n: (n) => String(n),
        },
        components: {
          BFormInput,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.last-name').exists()).toBe(true)
  })

  it('updates lastName when value prop changes', async () => {
    wrapper.vm.lastName = 'Doe'
    expect(wrapper.vm.lastName).toBe('Doe')
  })

  it('computes lastNameState correctly', async () => {
    expect(wrapper.vm.lastNameState).toBe(false)
    await wrapper.setData({ lastName: 'Doe' })
    expect(wrapper.vm.lastNameState).toBe(true)
  })

  it('renders label with correct text', () => {
    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('form.lastname')
  })

  it('renders BFormInput with correct props', () => {
    const input = wrapper.findComponent({ name: 'BFormInput' })
    expect(input.exists()).toBe(true)
    expect(input.props('id')).toBe('input-lastName')
    expect(input.props('state')).toBe(false)
    expect(input.props('placeholder')).toBe('Enter your lastName')
  })
})
