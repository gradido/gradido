// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import UserSettingsSwitch from './UserSettingsSwitch'

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: mockToastError, toastSuccess: mockToastSuccess }),
}))

const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: mockMutate }),
}))

const store = createStore({ state: {}, mutations: { gmsAllowed: () => {} } })

let wrapper = null

// The real checkbox from the library, not a stub: what is measured here is whether the
// tap moves it. Attached to the document, because jsdom only reports the change of a
// checkbox that is connected - detached, a free switch would look just as still as a
// locked one.
const mountSwitch = (props = {}) => {
  wrapper = mount(UserSettingsSwitch, {
    attachTo: document.body,
    props: {
      attrName: 'gmsAllowed',
      defer: true,
      notAllowedText: 'Set your home on the map first.',
      ...props,
    },
    global: { plugins: [store] },
  })
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('UserSettingsSwitch', () => {
  describe('when locked', () => {
    it('stays off under a tap and says why', async () => {
      const input = mountSwitch({ locked: true }).find('input')

      await input.trigger('click')

      expect(input.element.checked).toBe(false)
      expect(wrapper.emitted('value-changed')).toBeUndefined()
      expect(mockToastError).toHaveBeenCalledWith('Set your home on the map first.')
    })

    it('is held for a screen reader as well', () => {
      expect(mountSwitch({ locked: true }).find('input').attributes('aria-disabled')).toBe('true')
    })

    // The lock comes after the switch is there: the page learns only then whether the member
    // has a home. The library copies extra attributes to its input once, at creation - the
    // browser showed no aria-disabled on the page while this case above was green.
    it('tells a screen reader when the lock comes and goes later', async () => {
      const wrapper = mountSwitch()
      const input = wrapper.find('input')
      expect(input.attributes('aria-disabled')).toBeUndefined()

      await wrapper.setProps({ locked: true })
      expect(input.attributes('aria-disabled')).toBe('true')

      await wrapper.setProps({ locked: false })
      expect(input.attributes('aria-disabled')).toBeUndefined()
    })

    // The native attribute takes the switch out of the keyboard's reach - Tab skips it - and
    // the reason could never be said there.
    it('is not disabled', () => {
      expect(mountSwitch({ locked: true }).find('input').attributes('disabled')).toBeUndefined()
    })
  })

  // The other half: without the lock the same tap turns it on, silently. Otherwise the test
  // above would also hold for a switch that never moves at all.
  describe('when free', () => {
    it('turns on under a tap and says nothing', async () => {
      const input = mountSwitch().find('input')

      await input.trigger('click')

      expect(input.element.checked).toBe(true)
      expect(wrapper.emitted('value-changed')).toEqual([[true]])
      expect(mockToastError).not.toHaveBeenCalled()
      expect(input.attributes('aria-disabled')).toBeUndefined()
    })
  })

  it('gives the switch itself its name', () => {
    expect(mountSwitch({ label: 'Am I findable?' }).find('input').attributes('aria-label')).toBe(
      'Am I findable?',
    )
  })
})
