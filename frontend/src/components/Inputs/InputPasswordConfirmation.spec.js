import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import InputPasswordConfirmation from './InputPasswordConfirmation'
import { BCol, BRow } from 'bootstrap-vue-next'

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

describe('InputPasswordConfirmation', () => {
  let wrapper

  const global = {
    mocks: {
      $t: (key) => key,
    },
    components: {
      BRow,
      BCol,
    },
    stubs: {
      InputPassword: true,
    },
  }

  const Wrapper = () => {
    return mount(InputPasswordConfirmation, {
      global,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has two input fields', () => {
      expect(wrapper.findAll('input-password-stub')).toHaveLength(2)
    })
  })
})
