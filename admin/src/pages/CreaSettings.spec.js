// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CreaSettings from './CreaSettings.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (value) => String(value),
  }),
}))

// The server's answer. A real ref, not a plain object: the component watches it, and a
// test needs to hand the answer over AFTER the mount to see the gate open.
const creaSettingsResult = ref(null)
const creaSettingsError = ref(null)

const ANSWER = {
  creaSettings: {
    model: 'claude-opus-5',
    effort: 'high',
    fastMode: true,
    defaultModel: 'claude-sonnet-5',
    // ⛔ TRUE in the fixture on purpose, against a form that starts from false. The
    // form's default for this one is the safe direction, so a fixture that agreed with
    // it could not tell "read from the server" from "never read at all" - and this is
    // the field where that difference is a bill.
    matchingKeyingActive: true,
  },
}

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({ mutate: vi.fn() })),
  useQuery: vi.fn(() => ({
    result: creaSettingsResult,
    error: creaSettingsError,
  })),
}))

vi.mock('vuex', () => ({
  useStore: vi.fn(() => ({
    state: { moderator: { id: 0, name: 'test moderator', roles: ['ADMIN'] } },
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}))

const mockBFormGroup = {
  name: 'BFormGroup',
  template: '<div class="mock-bformgroup"><slot></slot></div>',
}
const mockBFormInput = {
  name: 'BFormInput',
  props: ['modelValue'],
  template: '<input data-testid="mock-bforminput" />',
}
const mockBFormSelect = {
  name: 'BFormSelect',
  props: ['modelValue', 'options'],
  template: '<select data-testid="mock-bformselect"></select>',
}
const mockBFormCheckbox = {
  name: 'BFormCheckbox',
  props: ['modelValue'],
  template: '<label class="mock-bformcheckbox"><slot></slot></label>',
}
// Declares `disabled` on purpose: without it the binding would land in attrs and the
// assertions below would pass against an ungated button.
const mockBButton = {
  name: 'BButton',
  props: ['disabled'],
  template: '<button :disabled="disabled"><slot></slot></button>',
}

describe('CreaSettings', () => {
  let wrapper

  const createWrapper = () =>
    mount(CreaSettings, {
      global: {
        stubs: {
          BFormGroup: mockBFormGroup,
          BFormInput: mockBFormInput,
          BFormSelect: mockBFormSelect,
          BFormCheckbox: mockBFormCheckbox,
          BButton: mockBButton,
        },
        mocks: { $t: (key) => key },
      },
    })

  beforeEach(() => {
    vi.clearAllMocks()
    creaSettingsResult.value = null
    creaSettingsError.value = null
  })

  // Both buttons submit the same form, and setCreaSettings overwrites all three settings
  // at once. Before the answer is in, that form holds display defaults - so a click would
  // clear the configured model and drop the effort level for the whole instance, and say
  // it succeeded.
  describe('before the settings have been read', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('does not let the form be saved', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0].attributes('disabled')).toBeDefined()
    })

    it('does not let the model be tested either', () => {
      expect(wrapper.findAll('button')[1].attributes('disabled')).toBeDefined()
    })

    it('says why nothing can be done yet', () => {
      expect(wrapper.text()).toContain('crea.settings.unavailable')
    })
  })

  // Not a race: the error watcher only raises a toast, so a query that failed leaves the
  // display defaults standing for as long as the page is open. The buttons have to stay
  // shut, or the failure turns into a silent overwrite at the admin's leisure.
  describe('when the query fails', () => {
    it('keeps both buttons shut', async () => {
      wrapper = createWrapper()
      creaSettingsError.value = new Error('502 Bad Gateway')
      await nextTick()

      const buttons = wrapper.findAll('button')
      expect(buttons[0].attributes('disabled')).toBeDefined()
      expect(buttons[1].attributes('disabled')).toBeDefined()
    })
  })

  describe('once the answer arrives', () => {
    beforeEach(async () => {
      wrapper = createWrapper()
      creaSettingsResult.value = ANSWER
      await nextTick()
    })

    it('releases both buttons', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons[0].attributes('disabled')).toBeUndefined()
      expect(buttons[1].attributes('disabled')).toBeUndefined()
    })

    it('drops the hint', () => {
      expect(wrapper.text()).not.toContain('crea.settings.unavailable')
    })

    // The values must be the server's, not the display defaults the form starts from -
    // otherwise the gate would be guarding an empty form and the test above would pass
    // for the wrong reason.
    it('shows what the server holds', () => {
      expect(wrapper.vm.form).toEqual({
        model: 'claude-opus-5',
        effort: 'high',
        fastMode: true,
        matchingKeyingActive: true,
      })
    })

    // The switch decides whether Crea is paid to key matching entries, and the run
    // re-reads it every pass - so switching it off here reaches a process that is
    // already running. It has to be on the page at all before any of that matters.
    it('offers the keying switch, with what it costs beside it', () => {
      expect(wrapper.text()).toContain('crea.settings.matchingKeying')
      expect(wrapper.text()).toContain('crea.settings.matchingKeyingHint')
    })

    it('carries the switch into what it sends, for the test call as well as the save', async () => {
      // ⚠️ `testCreaModel` takes the same input type, where the field is required too.
      // Leaving it out of `apiInput` would break the test button rather than the save,
      // which is the kind of thing that goes unnoticed until somebody presses it.
      const sent = wrapper.vm.apiInput()
      expect(sent.matchingKeyingActive).toBe(true)
    })
  })
})
