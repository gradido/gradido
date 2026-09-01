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
    // ⛔ TRUE against a form that starts from false, so "read from the server" can be
    // told apart from "never read at all" - the field where that difference is a bill.
    // ⚠️ And it must also differ from `fastMode` above, or the two are
    // indistinguishable and a v-model pointing at the wrong one passes: measured, an
    // injection binding this checkbox to `form.fastMode` left the whole file green
    // while both fixture values were `true`.
    matchingKeyingActive: false,
  },
}

// ⛔ Stable spies, one per mutation, handed out in the order the component asks for
// them: save first, then the model probe. The previous `vi.fn(() => ({ mutate:
// vi.fn() }))` made a fresh spy per call and captured none of them, so no test in this
// file could see what either button sent.
//
// ⚠️ `vi.hoisted`, because a `vi.mock` factory runs before the module body - and a
// COUNTER rather than `mockImplementationOnce`, because every test remounts and the
// `Once` implementations would be spent on the first mount. `beforeEach` resets it.
const { saveMutate, testMutate, mutations } = vi.hoisted(() => ({
  saveMutate: vi.fn(),
  testMutate: vi.fn(),
  mutations: { asked: 0 },
}))
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({ mutate: mutations.asked++ === 0 ? saveMutate : testMutate })),
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
// A real checkbox that EMITS, not a label. The label-only stub never exercised the
// binding in either direction, which is how a v-model pointing at the wrong field
// stayed invisible: the props went in and nothing ever came back out.
const mockBFormCheckbox = {
  name: 'BFormCheckbox',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<label class="mock-bformcheckbox"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)"><slot></slot></label>',
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
    // Every test remounts, and each mount asks for its two mutations again - so the
    // counter that hands out the spies has to start over with it.
    mutations.asked = 0
    creaSettingsResult.value = null
    creaSettingsError.value = null
  })

  // Both buttons submit the same form, and setCreaSettings overwrites all FOUR settings
  // at once - the fourth being the one that decides whether Crea is paid to key matching
  // entries. Before the answer is in, that form holds display defaults - so a click would
  // clear the configured model, drop the effort level for the whole instance, and write
  // the keying switch from a value nobody chose, and say it succeeded.
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
        matchingKeyingActive: false,
      })
    })

    it('offers the keying switch, with what it costs beside it', () => {
      expect(wrapper.text()).toContain('crea.settings.matchingKeying')
      expect(wrapper.text()).toContain('crea.settings.matchingKeyingHint')
    })

    // ⛔ The binding itself, through the checkbox rather than around it. Ticking the
    // box must move THIS field and nothing else: an injection that bound it to
    // `form.fastMode` used to leave the whole file green, because the stub emitted
    // nothing and both fixture values were `true`.
    it('moves the keying switch and only that one when its box is ticked', async () => {
      const boxes = wrapper.findAllComponents({ name: 'BFormCheckbox' })
      expect(boxes).toHaveLength(2)
      await boxes[1].find('input').setValue(true)

      expect(wrapper.vm.form.matchingKeyingActive).toBe(true)
      expect(wrapper.vm.form.fastMode).toBe(true)
    })

    // The whole payload, not one key. The rewrite of `apiInput` was performed around
    // the three existing fields, and asserting only the new one could not see them:
    // measured, deleting `effort` from it left this file green while both mutations
    // would have died on a GraphQL validation error.
    it('sends every setting when Save is pressed', async () => {
      await wrapper.findAll('button')[0].trigger('click')

      expect(saveMutate).toHaveBeenCalledWith({
        input: {
          model: 'claude-opus-5',
          effort: 'high',
          fastMode: true,
          matchingKeyingActive: false,
        },
      })
    })

    // ⚠️ `testCreaModel` takes the same input type. The probe ignores the switch, but
    // the field travels with it - and this is the button that would have broken
    // rather than the save, which nobody notices until they press it.
    it('sends the same settings when the model is probed', async () => {
      await wrapper.findAll('button')[1].trigger('click')

      expect(testMutate).toHaveBeenCalledWith({
        input: {
          model: 'claude-opus-5',
          effort: 'high',
          fastMode: true,
          matchingKeyingActive: false,
        },
      })
    })
  })
})
