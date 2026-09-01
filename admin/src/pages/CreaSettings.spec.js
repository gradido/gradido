// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CreaSettings from './CreaSettings.vue'

// ⛔ Hoisted and stable. The previous mock built fresh, uncaptured spies per call, so
// nothing could see which message was raised - swapping the success and conflict arms
// of `saveKeying` was green, and so was making the moderation save claim the matching
// one. Those two messages are the whole point of telling the sections apart.
const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastSuccess, toastError }) }))

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
    //
    // ⚠️ Which leaves it equal to `fastMode` above, and that cannot be helped by
    // choosing values: both must differ from the form's default of `false`, so both
    // must be `true`, so they cannot differ from each other. The binding is therefore
    // told apart by DIRECTION rather than by value - the checkbox test below toggles
    // one and asserts the other did not move.
    matchingKeyingActive: true,
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
// ⛔ They RESOLVE. A bare `vi.fn()` returns `undefined`, `const { data } = await
// mutate(...)` throws a TypeError, and every click test lands in the catch - which
// means the success path of both saves was dead code as far as this file was
// concerned. Measured: with bare mocks, deleting the `...form.value` spread or the
// read-back assignment left all twelve green.
const { saveMutate, testMutate, keyingMutate, mutations } = vi.hoisted(() => ({
  saveMutate: vi.fn(() =>
    Promise.resolve({
      data: {
        setCreaSettings: {
          model: 'claude-opus-5',
          effort: 'high',
          defaultModel: 'claude-sonnet-5',
          fastMode: true,
        },
      },
    }),
  ),
  testMutate: vi.fn(() =>
    Promise.resolve({ data: { testCreaModel: { ok: true, code: 'ok', message: 'hi' } } }),
  ),
  keyingMutate: vi.fn(() => Promise.resolve({ data: { setCreaMatchingKeying: true } })),
  mutations: { asked: 0 },
}))
vi.mock('@vue/apollo-composable', () => ({
  // In the order the component asks: the moderation save, the model probe, the keying
  // switch. Three now, because the two sections have a Save each.
  useMutation: vi.fn(() => ({ mutate: [saveMutate, testMutate, keyingMutate][mutations.asked++] })),
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

    it('shuts every button, including the one that spends', () => {
      // Three now, one per thing that can be done: save moderation, probe the model,
      // save matching. ⛔ Counted rather than indexed, so a fourth button arriving
      // ungated cannot slip through - the gate exists because the form holds display
      // defaults until the query answers, and submitting those would write a switch
      // value nobody chose.
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(3)
      for (const button of buttons) {
        expect(button.attributes('disabled')).toBeDefined()
      }
    })

    it('says why nothing can be done yet', () => {
      expect(wrapper.text()).toContain('crea.settings.unavailable')
    })
  })

  // Not a race: the error watcher only raises a toast, so a query that failed leaves the
  // display defaults standing for as long as the page is open. The buttons have to stay
  // shut, or the failure turns into a silent overwrite at the admin's leisure.
  describe('when the query fails', () => {
    it('keeps every button shut, the one that spends included', async () => {
      wrapper = createWrapper()
      creaSettingsError.value = new Error('502 Bad Gateway')
      await nextTick()

      // ⛔ Counted, not indexed. This is the branch where a keying button wired to the
      // wrong condition would go unseen: a failed query leaves the form on its display
      // defaults, and one click would then send `active: false` for a community that
      // had it on.
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(3)
      for (const button of buttons) {
        expect(button.attributes('disabled')).toBeDefined()
      }
    })
  })

  describe('once the answer arrives', () => {
    beforeEach(async () => {
      wrapper = createWrapper()
      creaSettingsResult.value = ANSWER
      await nextTick()
    })

    it('releases every button', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(3)
      for (const button of buttons) {
        expect(button.attributes('disabled')).toBeUndefined()
      }
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

    it('offers the keying switch, with what it costs beside it', () => {
      expect(wrapper.text()).toContain('crea.settings.matchingKeying')
      expect(wrapper.text()).toContain('crea.settings.matchingKeyingHint')
    })

    // ⛔ The binding itself, through the checkbox rather than around it, and told apart
    // by which field MOVES rather than by what the two hold. Both start `true` from the
    // fixture; unticking the keying box must leave fast mode where it was. An injection
    // binding this checkbox to `form.fastMode` used to leave the whole file green.
    it('moves the keying switch and only that one when its box is unticked', async () => {
      const boxes = wrapper.findAllComponents({ name: 'BFormCheckbox' })
      expect(boxes).toHaveLength(2)
      await boxes[1].find('input').setValue(false)

      expect(wrapper.vm.form.matchingKeyingActive).toBe(false)
      expect(wrapper.vm.form.fastMode).toBe(true)
    })

    // The whole payload, not one key. The rewrite of `apiInput` was performed around
    // the three existing fields, and asserting only the new one could not see them:
    // measured, deleting `effort` from it left this file green while both mutations
    // would have died on a GraphQL validation error.
    it('sends the moderation settings when its Save is pressed, and not the switch', async () => {
      await wrapper.findAll('button')[0].trigger('click')

      // ⛔ No `matchingKeyingActive` in here, and that absence is the point: the two
      // sections save separately, so a model save cannot carry a stale switch value
      // from a tab that has been open since before somebody else changed it.
      expect(saveMutate).toHaveBeenCalledWith({
        input: { model: 'claude-opus-5', effort: 'high', fastMode: true },
      })
      expect(keyingMutate).not.toHaveBeenCalled()
    })

    it('sends only the switch when the matching Save is pressed, and the right field', async () => {
      // ⛔ Unticked FIRST, so the payload is told apart by direction rather than by
      // value. With the fixture's `fastMode` and `matchingKeyingActive` both `true`,
      // pointing this mutation at the wrong form field was green - the file's own
      // header comment names that hazard and the checkbox test obeys it; this one
      // did not.
      const boxes = wrapper.findAllComponents({ name: 'BFormCheckbox' })
      await boxes[1].find('input').setValue(false)
      const buttons = wrapper.findAll('button')
      await buttons[buttons.length - 1].trigger('click')

      expect(keyingMutate).toHaveBeenCalledWith({ active: false })
      expect(saveMutate).not.toHaveBeenCalled()
    })

    // #3: which message was raised, per section. Swapping the two arms of `saveKeying`
    // used to be green, and so did making the moderation save claim the matching one.
    it('says which section was saved', async () => {
      await wrapper.findAll('button')[0].trigger('click')
      expect(toastSuccess).toHaveBeenCalledWith('crea.settings.savedModeration')

      toastSuccess.mockClear()
      const buttons = wrapper.findAll('button')
      await buttons[buttons.length - 1].trigger('click')
      expect(toastSuccess).toHaveBeenCalledWith('crea.settings.savedMatching')
    })

    it('does not claim a save when somebody else moved the switch', async () => {
      keyingMutate.mockResolvedValueOnce({ data: { setCreaMatchingKeying: false } })
      const buttons = wrapper.findAll('button')

      await buttons[buttons.length - 1].trigger('click')

      expect(toastError).toHaveBeenCalledWith('crea.settings.matchingChangedElsewhere')
      expect(toastSuccess).not.toHaveBeenCalled()
    })

    // ⛔ The success path, which no test in this file used to reach. Both of these
    // guard a single line that the previous version left as dead code.
    it('keeps the switch across a moderation save', async () => {
      await wrapper.findAll('button')[0].trigger('click')

      // The mutation answers with the three fields it owns; without the spread in
      // `save()` the switch would come back `undefined`, render as unticked whatever
      // the truth is, and the next matching Save would send that.
      expect(wrapper.vm.form.matchingKeyingActive).toBe(true)
    })

    it('takes the stored switch from the answer, not the one it sent', async () => {
      keyingMutate.mockResolvedValueOnce({ data: { setCreaMatchingKeying: false } })
      const buttons = wrapper.findAll('button')

      await buttons[buttons.length - 1].trigger('click')

      // Somebody else wrote in between: the box follows the database rather than the
      // click, and the message says so instead of claiming a save.
      expect(wrapper.vm.form.matchingKeyingActive).toBe(false)
    })

    it('shuts the matching Save while its own save is in flight', async () => {
      // ⛔ Its OWN flag. Wiring this button to `saving` - the moderation one - was
      // green, and so was deleting the flag entirely, leaving the button that spends
      // money re-clickable while its mutation is out.
      let release
      keyingMutate.mockReturnValueOnce(new Promise((resolve) => (release = resolve)))
      const buttons = wrapper.findAll('button')

      buttons[buttons.length - 1].trigger('click')
      await nextTick()

      expect(wrapper.findAll('button')[2].attributes('disabled')).toBeDefined()
      expect(wrapper.findAll('button')[0].attributes('disabled')).toBeUndefined()
      release({ data: { setCreaMatchingKeying: true } })
    })

    it('keeps a click made while the save was in flight', async () => {
      // ⛔ The box stays editable during the request. Reading what was "asked" after
      // the await would compare the server against a value nobody sent - a conflict
      // that did not happen - and then overwrite the newer click with the older
      // stored value.
      let release
      keyingMutate.mockReturnValueOnce(new Promise((resolve) => (release = resolve)))
      const buttons = wrapper.findAll('button')
      buttons[buttons.length - 1].trigger('click')
      await nextTick()

      // The admin changes their mind while the request is out.
      const boxes = wrapper.findAllComponents({ name: 'BFormCheckbox' })
      await boxes[1].find('input').setValue(false)
      release({ data: { setCreaMatchingKeying: true } })
      await nextTick()
      await nextTick()

      // Sent what was on screen at click time...
      expect(keyingMutate).toHaveBeenCalledWith({ active: true })
      // ...answered consistently with it, so no conflict...
      expect(toastError).not.toHaveBeenCalled()
      // ...and the newer click is still there, unsaved rather than overwritten.
      expect(wrapper.vm.form.matchingKeyingActive).toBe(false)
    })

    it('gives each section its own Save', () => {
      // Three buttons: save moderation, probe the model, save matching.
      expect(wrapper.findAll('button')).toHaveLength(3)
      // ⚠️ Negative lookahead, not `toContain`: `sectionMatchingHint` carries the
      // heading's key as a prefix, so `toContain` was satisfied by the hint below it
      // and deleting the heading outright stayed green.
      expect(wrapper.text()).toMatch(/sectionModeration(?!Hint)/)
      expect(wrapper.text()).toMatch(/sectionMatching(?!Hint)/)
    })

    // ⚠️ `testCreaModel` takes the same input type. The probe ignores the switch, but
    // the field travels with it - and this is the button that would have broken
    // rather than the save, which nobody notices until they press it.
    it('probes with the moderation settings, which is all that input carries now', async () => {
      await wrapper.findAll('button')[1].trigger('click')

      expect(testMutate).toHaveBeenCalledWith({
        input: { model: 'claude-opus-5', effort: 'high', fastMode: true },
      })
    })
  })
})
