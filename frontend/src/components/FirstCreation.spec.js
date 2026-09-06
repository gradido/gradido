// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import FirstCreation from './FirstCreation.vue'
import de from '@/locales/de.json'
import {
  firstLoginWindow,
  forgetFirstLoginWindows,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'

vi.mock('bootstrap-vue-next', () => ({
  // ⛔ `emits` is not decoration -- see AliasFirstChoice.spec.js: without it one click runs
  // the handler twice, which turns a "sent once" assertion into a lie.
  BButton: {
    emits: ['click'],
    props: ['disabled'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot></slot></button>',
  },
  BFormTextarea: {
    props: ['modelValue'],
    // `focus` so a test can see WHERE the window sent the cursor -- without it, "the tap
    // did nothing" and "the tap went to the open box" look exactly alike.
    methods: {
      focus() {
        focused.push(this.$attrs['data-test'])
      },
    },
    template:
      '<textarea :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />',
  },
  // Named and driven by `modelValue`, so a test can close the window the way the member
  // does -- from the outside, through v-model.
  BModal: {
    name: 'BModal',
    props: ['modelValue'],
    template: '<div v-if="modelValue"><slot></slot><slot name="footer"></slot></div>',
  },
}))

const { focused } = vi.hoisted(() => ({ focused: [] }))
const storeState = reactive({ firstName: 'Ira', creationAllowed: true })
const committed = []
vi.mock('vuex', () => ({
  useStore: () => ({
    state: storeState,
    commit: (name, value) => {
      committed.push([name, value])
      storeState[name] = value
    },
  }),
}))

const routePath = ref('/overview')
const pushed = []
vi.mock('vue-router', () => ({
  useRoute: () => ({
    get path() {
      return routePath.value
    },
  }),
  useRouter: () => ({ push: (to) => pushed.push(to) }),
}))

const statusMock = ref(null)
const refetchMock = vi.fn()
const submitMock = vi.fn()
const skipMock = vi.fn()
const declareMock = vi.fn()

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: statusMock, refetch: refetchMock }),
  useMutation: (document) => ({
    mutate: (variables) => {
      if (document === 'SUBMIT_FIRST_CREATION') return submitMock(variables)
      if (document === 'DECLARE_PROJECT_ACCOUNT') return declareMock(variables)
      return skipMock(variables)
    },
  }),
}))

vi.mock('@/graphql/firstCreation.graphql', () => ({
  firstCreationStatus: 'FIRST_CREATION_STATUS',
  submitFirstCreation: 'SUBMIT_FIRST_CREATION',
  skipFirstCreation: 'SKIP_FIRST_CREATION',
}))
vi.mock('@/graphql/user.graphql', () => ({
  declareProjectAccount: 'DECLARE_PROJECT_ACCOUNT',
}))

const i18n = createI18n({ locale: 'de', legacy: false, messages: { de } })

const status = (over = {}) => ({
  state: 'NONE',
  eligible: true,
  message: null,
  entries: [],
  skippedBefore: false,
  functionTestsEnabled: false,
  testRunsLeft: null,
  ...over,
})

const settled = (state, entries, message) => ({
  data: { submitFirstCreation: status({ state, eligible: false, entries, message }) },
})

const entry = (memo, confirmed = true) => ({
  memo,
  confirmed,
  status: confirmed ? 'CONFIRMED' : 'PENDING',
})

/**
 * What a refetch answers -- and it writes the answer into the LIVE result too, because that
 * is what apollo's refetch does.
 *
 * ⛔ Not a detail. Without it the live result kept saying `eligible: true` for the whole
 * test, so the window's stickiness (`opened`) could be replaced by a live read of `eligible`
 * and every test in this file stayed green -- while on the real thing the window would
 * vanish the moment `ask()` came back after a cut connection.
 */
const answerRefetchWith = (next) => {
  refetchMock.mockImplementation(async () => {
    statusMock.value = { firstCreationStatus: next }
    return { data: { firstCreationStatus: next } }
  })
}

/**
 * ⚠️ Every mount is remembered and taken down again in `afterEach`.
 *
 * Not tidiness: `statusMock` is one reactive ref shared by every instance, and this
 * component starts an interval of its own while a row sits in SUBMITTED. A wrapper left
 * standing from an earlier test therefore keeps watching the same ref, and the moment a
 * later test puts SUBMITTED into it every one of those ghosts starts polling too. Measured,
 * not feared: the poll assertions counted fifteen calls where one was due.
 */
const mounted = []
const build = (props = {}) => {
  const wrapper = mount(FirstCreation, {
    props,
    global: { plugins: [i18n], mocks: { $filters: { amount: (value) => String(value) } } },
  })
  mounted.push(wrapper)
  return wrapper
}

/** Opens a stem's field and types into it. */
const write = async (wrapper, stem, text) => {
  await wrapper.find(`[data-test="first-creation-stem-${stem}"]`).trigger('click')
  await nextTick()
  const fields = wrapper.findAll(`[data-test^="first-creation-text-"]`)
  await fields[fields.length - 1].setValue(text)
  await nextTick()
}

beforeEach(() => {
  vi.useFakeTimers()
  routePath.value = '/overview'
  storeState.firstName = 'Ira'
  focused.length = 0
  pushed.length = 0
  statusMock.value = { firstCreationStatus: status() }
  refetchMock.mockReset()
  answerRefetchWith(status())
  submitMock.mockReset().mockResolvedValue(settled('DONE', [entry('eins')], 'Danke.'))
  skipMock.mockReset().mockResolvedValue({})
  declareMock.mockReset().mockResolvedValue({ data: { declareProjectAccount: true } })
  storeState.creationAllowed = true
  committed.length = 0
  forgetFirstLoginWindows()
})

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
  forgetFirstLoginWindows()
})

describe('FirstCreation', () => {
  describe('whether it shows at all', () => {
    it('shows the form when the member is eligible', () => {
      const wrapper = build()
      expect(wrapper.find('[data-test="first-creation-form"]').exists()).toBe(true)
    })

    it('greets the member by their first name, and without one greets them anyway', async () => {
      const wrapper = build()
      expect(wrapper.find('[data-test="first-creation-welcome"]').text()).toBe('Willkommen, Ira!')

      // ⚠️ Never "Willkommen, !" -- an account without a first name gets the nameless form.
      storeState.firstName = ''
      await nextTick()
      expect(wrapper.find('[data-test="first-creation-welcome"]').text()).toBe('Willkommen!')
    })

    it('stays away while the member is not eligible', () => {
      statusMock.value = { firstCreationStatus: status({ eligible: false }) }
      expect(build().find('[data-test="first-creation"]').exists()).toBe(false)
      // The counter-check: the same component with the same mount DOES show once the
      // server says eligible, so "stays away" is not just an empty render.
      statusMock.value = { firstCreationStatus: status({ eligible: true }) }
      expect(build().find('[data-test="first-creation"]').exists()).toBe(true)
    })

    it('stays away on the settings routes, and returns on the way out', async () => {
      routePath.value = '/settings/account'
      const wrapper = build()
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(false)
      routePath.value = '/overview'
      await nextTick()
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(true)
    })

    it('stays away while another first-login window has the screen', async () => {
      // The address reminder outranks it (ES-003).
      setFirstLoginWindowWanted('email', true)
      const wrapper = build()
      expect(firstLoginWindow.value).toBe('email')
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(false)

      setFirstLoginWindowWanted('email', false)
      await nextTick()
      expect(firstLoginWindow.value).toBe('firstCreation')
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(true)
    })

    it('is not read as answered when another window takes the screen', async () => {
      const wrapper = build()
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(true)

      // The reminder returns (it does past its deadline) and BModal writes the closing back.
      setFirstLoginWindowWanted('email', true)
      await nextTick()
      await wrapper.findComponent({ name: 'BModal' }).vm.$emit('update:modelValue', false)
      await nextTick()

      setFirstLoginWindowWanted('email', false)
      await nextTick()
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(true)
    })

    it('keeps the window open once the entries are sent, though the member stops being eligible', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await vi.runAllTimersAsync()

      // The row is settled, so the server stops calling this member eligible -- and any
      // later read of the query says so. On the real thing that read is `ask()` after a cut
      // connection; here it is put in by hand, because the fixture has to reach the state
      // the window has to survive.
      statusMock.value = { firstCreationStatus: status({ eligible: false, state: 'DONE' }) }
      await nextTick()

      // ⛔ The whole point: reading `eligible` into v-model would take the window away at
      // the moment it finally has something to say.
      expect(wrapper.find('[data-test="first-creation-result"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(true)
    })

    it('lets go of the screen when it is unmounted', () => {
      const wrapper = build()
      expect(firstLoginWindow.value).toBe('firstCreation')
      wrapper.unmount()
      expect(firstLoginWindow.value).toBe(null)
    })
  })

  describe('the form', () => {
    it('holds Save until there is an entry', async () => {
      const wrapper = build()
      const save = wrapper.find('[data-test="first-creation-save"]')
      expect(save.attributes('disabled')).toBeDefined()

      await wrapper.find('[data-test="first-creation-check-retiree"]').trigger('click')
      expect(
        wrapper.find('[data-test="first-creation-save"]').attributes('disabled'),
      ).toBeUndefined()
    })

    it('holds Save while a field has one or two words, and says so AT the field', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen')
      expect(wrapper.find('[data-test="first-creation-save"]').attributes('disabled')).toBeDefined()
      // ⛔ The point of the change: the reason stands where the cause is, not only as a
      // pale button on the far side of the window.
      expect(wrapper.find('[data-test^="first-creation-short-"]').exists()).toBe(true)

      // Into the SAME field -- `write` would click the stem again and open a second one.
      await wrapper
        .find('[data-test^="first-creation-text-"]')
        .setValue('Kuchen für das Fest gebacken habe')
      await nextTick()
      expect(
        wrapper.find('[data-test="first-creation-save"]').attributes('disabled'),
      ).toBeUndefined()
      expect(wrapper.find('[data-test^="first-creation-short-"]').exists()).toBe(false)
    })

    /**
     * ⛔ Bernd's finding at the first acceptance run: he tapped "one more with this
     * beginning", never used the box, and Save went pale with nothing on screen to say why
     * -- "das fällt selbst mir als IT-affinen Menschen kaum auf".
     */
    it('lets an untouched extra field alone: it neither blocks, nor counts, nor is sent', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-again-helpedParish"]').trigger('click')
      await nextTick()
      expect(wrapper.findAll('[data-test^="first-creation-text-"]')).toHaveLength(2)

      // not blocked ...
      expect(
        wrapper.find('[data-test="first-creation-save"]').attributes('disabled'),
      ).toBeUndefined()
      // ... not counted (German writes the singular out: "ein Eintrag", not "1") ...
      expect(wrapper.find('[data-test="first-creation-count"]').text()).toBe(
        de.firstCreation.entries.split(' | ')[0],
      )
      // ... and not sent.
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      expect(submitMock).toHaveBeenCalledWith({
        entries: [{ catalogKey: 'helpedParish', text: 'Kuchen für das Fest gebacken habe' }],
      })
    })

    /**
     * ⛔ coderabbit, outside the diff, on the change that made blank fields free: an empty
     * box is a LATENT entry. Left standing while the remaining slots and the tick are used
     * up, filling it afterwards made eleven — and the backend refuses more than ten with
     * `TOO_MANY`, which reaches the member as a bare "that did not work" that no retry
     * fixes. This walks that exact path.
     */
    it('never lets a blank box carry the member past the maximum', async () => {
      const wrapper = build()
      const fill = async (index) => {
        const boxes = wrapper.findAll('[data-test^="first-creation-text-"]')
        await boxes[index].setValue(`Satz Nummer ${index} geschrieben habe`)
        await nextTick()
      }

      // Nine written entries under one beginning ...
      await write(wrapper, 'helpedParish', 'Satz Nummer 0 geschrieben habe')
      for (let n = 1; n < 9; n++) {
        await wrapper.find('[data-test="first-creation-again-helpedParish"]').trigger('click')
        await nextTick()
        await fill(n)
      }
      expect(wrapper.findAll('[data-test^="first-creation-text-"]')).toHaveLength(9)

      // ... plus one box that is opened and left alone. That is the tenth SLOT.
      await wrapper.find('[data-test="first-creation-again-helpedParish"]').trigger('click')
      await nextTick()
      expect(wrapper.findAll('[data-test^="first-creation-text-"]')).toHaveLength(10)
      expect(wrapper.find('[data-test="first-creation-max"]').exists()).toBe(true)

      // The tick would be the eleventh and is refused, though only nine are written.
      await wrapper.find('[data-test="first-creation-check-retiree"]').trigger('click')
      await nextTick()

      // Now the blank is filled after the fact -- the step that used to make eleven.
      await fill(9)
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')

      expect(submitMock).toHaveBeenCalledTimes(1)
      expect(submitMock.mock.calls[0][0].entries.length).toBeLessThanOrEqual(10)
    })

    it('takes the member back to the empty box rather than opening a second one', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-stem-helpedParish"]').trigger('click')
      await nextTick()
      focused.length = 0

      await wrapper.find('[data-test="first-creation-stem-helpedParish"]').trigger('click')
      await nextTick()
      const boxes = wrapper.findAll('[data-test^="first-creation-text-"]')
      expect(boxes).toHaveLength(1)
      // Not a no-op: the cursor goes to the box that is already there -- named, not counted.
      expect(focused).toEqual([boxes[0].attributes('data-test')])
    })

    /**
     * ⛔ coderabbit, second round, outside the diff — and it is the class this whole PR is
     * about: a control that does nothing, silently. With the cap checked first, a member at
     * the slot cap who tapped the stem of their own empty box got no response at all, even
     * though going there opens no slot.
     */
    it('still goes to the open box when every slot is taken', async () => {
      const wrapper = build()
      const fill = async (index) => {
        const boxes = wrapper.findAll('[data-test^="first-creation-text-"]')
        await boxes[index].setValue(`Satz Nummer ${index} geschrieben habe`)
        await nextTick()
      }
      await write(wrapper, 'helpedParish', 'Satz Nummer 0 geschrieben habe')
      for (let n = 1; n < 9; n++) {
        await wrapper.find('[data-test="first-creation-again-helpedParish"]').trigger('click')
        await nextTick()
        await fill(n)
      }
      // The tenth slot, left empty -- now every slot is taken.
      await wrapper.find('[data-test="first-creation-again-helpedParish"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="first-creation-max"]').exists()).toBe(true)
      focused.length = 0

      await wrapper.find('[data-test="first-creation-stem-helpedParish"]').trigger('click')
      await nextTick()

      // ⚠️ WHICH box, not how many focus calls. With ten boxes on screen, a count of one
      // holds just as well when the cursor lands in somebody else's finished sentence.
      const boxes = wrapper.findAll('[data-test^="first-creation-text-"]')
      expect(boxes).toHaveLength(10)
      expect(focused).toEqual([boxes[9].attributes('data-test')])
    })

    /**
     * Weg A (Bernd, 06.09.): what the member writes stands in the SENTENCE while they write
     * it, not only in the box below -- so "indem ich Ich habe ..." shows itself at the
     * moment it is written instead of in the ledger afterwards.
     */
    it('echoes the words into the sentence they complete', async () => {
      const wrapper = build()
      const row = () => wrapper.find('[data-test="first-creation-stem-helpedParish"]').text()
      expect(row()).toContain('indem ich …')

      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      expect(row()).toContain('indem ich Kuchen für das Fest gebacken habe')
      expect(row()).not.toContain('…')
    })

    it('takes several entries from one beginning (ES-008)', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-again-helpedParish"]').trigger('click')
      await nextTick()
      const fields = wrapper.findAll('[data-test^="first-creation-text-"]')
      await fields[1].setValue('den Saal geputzt habe')
      await nextTick()

      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      expect(submitMock).toHaveBeenCalledWith({
        entries: [
          { catalogKey: 'helpedParish', text: 'Kuchen für das Fest gebacken habe' },
          { catalogKey: 'helpedParish', text: 'den Saal geputzt habe' },
        ],
      })
    })

    it('sends a tick as an entry with no text of its own', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-check-retiree"]').trigger('click')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      expect(submitMock).toHaveBeenCalledWith({
        entries: [{ catalogKey: 'retiree', text: null }],
      })
    })

    it('counts the entries without naming an amount (W2)', async () => {
      const wrapper = build()
      expect(wrapper.find('[data-test="first-creation-count"]').text()).toContain('0')
      await wrapper.find('[data-test="first-creation-check-retiree"]').trigger('click')
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      const shown = wrapper.find('[data-test="first-creation-count"]').text()
      expect(shown).toContain('2')
      expect(shown).not.toMatch(/GDD|33|50|100/)
    })

    it('stops at ten entries', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'einmal geholfen habe')
      for (let index = 1; index < 12; index++) {
        const again = wrapper.find('[data-test="first-creation-again-helpedParish"]')
        if (!again.exists()) break
        await again.trigger('click')
        await nextTick()
        const fields = wrapper.findAll('[data-test^="first-creation-text-"]')
        await fields[fields.length - 1].setValue('noch einmal geholfen habe')
        await nextTick()
      }
      expect(wrapper.findAll('[data-test^="first-creation-text-"]')).toHaveLength(10)
      expect(wrapper.find('[data-test="first-creation-max"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-again-helpedParish"]').exists()).toBe(false)
    })

    it('unfolds a category and keeps a written entry visible when it folds back', async () => {
      const wrapper = build()
      // communityVolunteering has six stems, three of them open.
      expect(wrapper.find('[data-test="first-creation-stem-helpedNeighbourhood"]').exists()).toBe(
        false,
      )
      await wrapper.find('[data-test="first-creation-more-communityVolunteering"]').trigger('click')
      expect(wrapper.find('[data-test="first-creation-stem-helpedNeighbourhood"]').exists()).toBe(
        true,
      )

      await write(wrapper, 'helpedNeighbourhood', 'für die Kinder gekocht habe')
      await wrapper.find('[data-test="first-creation-more-communityVolunteering"]').trigger('click')
      // ⚠️ Folded up again -- but the sentence is in the list being sent, so it has to
      // stay on screen.
      expect(wrapper.find('[data-test="first-creation-entry-helpedNeighbourhood"]').exists()).toBe(
        true,
      )
    })

    it('takes an entry back', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      const remove = wrapper.find('[data-test^="first-creation-remove-"]')
      await remove.trigger('click')
      expect(wrapper.findAll('[data-test^="first-creation-text-"]')).toHaveLength(0)
      expect(wrapper.find('[data-test="first-creation-save"]').attributes('disabled')).toBeDefined()
    })

    it('calls skipFirstCreation and closes on "nothing comes to mind" once the question was asked', async () => {
      // The server says this member has skipped before: no question, straight out.
      statusMock.value = { firstCreationStatus: status({ skippedBefore: true }) }
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await vi.runAllTimersAsync()
      expect(skipMock).toHaveBeenCalledTimes(1)
      expect(submitMock).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="first-creation-project-ask"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(false)
      expect(firstLoginWindow.value).toBe(null)
    })
  })

  /* ES-012: the project account explains itself here, behind "nothing comes to mind". */
  describe('the project-account question', () => {
    it('is asked on the first "nothing comes to mind", before anything is sent', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="first-creation-project-ask"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-form"]').exists()).toBe(false)
      expect(skipMock).not.toHaveBeenCalled()
      expect(declareMock).not.toHaveBeenCalled()
      // Still the same window on the stage -- not a dismissal.
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(true)
    })

    it('"Later" skips as before and closes', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="first-creation-later"]').trigger('click')
      await vi.runAllTimersAsync()
      expect(skipMock).toHaveBeenCalledTimes(1)
      expect(declareMock).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(false)
      expect(storeState.creationAllowed).toBe(true)
    })

    it('"This is a project account" declares it, tells the store and closes without a skip', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="first-creation-project-account"]').trigger('click')
      await vi.runAllTimersAsync()
      expect(declareMock).toHaveBeenCalledTimes(1)
      expect(skipMock).not.toHaveBeenCalled()
      // The menu item hangs on this; it must not wait for the next verifyLogin.
      expect(committed).toContainEqual(['creationAllowed', false])
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(false)
    })

    it('stays on the question and says why when the server refuses', async () => {
      declareMock.mockRejectedValue(new Error('PROJECT_ACCOUNT_REFUSED: OPEN_CONTRIBUTIONS'))
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="first-creation-project-account"]').trigger('click')
      await vi.runAllTimersAsync()
      expect(wrapper.find('[data-test="first-creation-project-ask"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-project-failed"]').text()).toBe(
        de.settings.creationAccount.openContributions,
      )
      expect(storeState.creationAllowed).toBe(true)
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(true)
    })
  })

  describe('waiting', () => {
    it('shows the waiting screen with the member´s own sentences while the answer is out', async () => {
      let release
      submitMock.mockImplementation(
        () => new Promise((resolve) => (release = () => resolve(settled('DONE', [entry('a')])))),
      )
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-check-retiree"]').trigger('click')
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await nextTick()

      const waiting = wrapper.find('[data-test="first-creation-waiting"]')
      expect(waiting.exists()).toBe(true)
      expect(waiting.text()).toContain('Ich bin Rentnerin')
      // Stem, connector and the member's words -- not the bare catalog key.
      expect(waiting.text()).toContain('Ich habe in meiner Gemeinde')
      expect(waiting.text()).toContain('indem ich Kuchen für das Fest gebacken habe')
      expect(waiting.text()).not.toContain('helpedParish')
      // Nothing to press while the request is still out there.
      expect(wrapper.find('[data-test="first-creation-waiting-close"]').exists()).toBe(false)

      release()
      await vi.runAllTimersAsync()
    })

    it('shows the waiting screen for a row somebody else is running (SUBMITTED)', () => {
      statusMock.value = {
        firstCreationStatus: status({ state: 'SUBMITTED', entries: [entry('a', false)] }),
      }
      const wrapper = build()
      expect(wrapper.find('[data-test="first-creation-waiting"]').exists()).toBe(true)
      // And a way out, because this request is not ours to wait for.
      expect(wrapper.find('[data-test="first-creation-waiting-close"]').exists()).toBe(true)
    })

    it('asks the server again rather than showing an error when the request never returns', async () => {
      // ⚠️ The nginx cut: `/graphql` has no proxy_read_timeout, so 60 s applies, and the
      // model deadline behind this mutation is exactly 60 s. The backend keeps working.
      submitMock.mockRejectedValue(new Error('Failed to fetch'))
      answerRefetchWith(
        status({ state: 'DONE', eligible: false, entries: [entry('a')], message: 'Danke.' }),
      )
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await vi.runAllTimersAsync()

      expect(refetchMock).toHaveBeenCalled()
      expect(wrapper.find('[data-test="first-creation-result"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-failed"]').exists()).toBe(false)
    })

    it('says so and keeps the form when the server says nothing was filed', async () => {
      submitMock.mockRejectedValue(new Error('nope'))
      answerRefetchWith(status())
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await vi.runAllTimersAsync()

      expect(wrapper.find('[data-test="first-creation-form"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-failed"]').exists()).toBe(true)
      // The words are still there -- nothing typed is thrown away by a failure.
      expect(wrapper.findAll('[data-test^="first-creation-text-"]')).toHaveLength(1)
    })

    it('keeps asking while a row it does not own sits in SUBMITTED', async () => {
      // The process is still running, so every answer says the same thing.
      answerRefetchWith(status({ state: 'SUBMITTED' }))
      statusMock.value = { firstCreationStatus: status({ state: 'SUBMITTED' }) }
      build()
      expect(refetchMock).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(5000)
      expect(refetchMock).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(10000)
      expect(refetchMock).toHaveBeenCalledTimes(3)
    })

    it('stops asking once the row has settled', async () => {
      statusMock.value = { firstCreationStatus: status({ state: 'SUBMITTED' }) }
      build()
      await vi.advanceTimersByTimeAsync(5000)
      expect(refetchMock).toHaveBeenCalledTimes(1)

      statusMock.value = {
        firstCreationStatus: status({
          state: 'IN_REVIEW',
          eligible: false,
          message: 'Ein Mensch.',
        }),
      }
      await nextTick()
      await vi.advanceTimersByTimeAsync(20000)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('the result', () => {
    const threeEntries = [entry('eins'), entry('zwei'), entry('drei')]

    const sendThree = async (wrapper) => {
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await nextTick()
      await nextTick()
    }

    beforeEach(() => {
      submitMock.mockResolvedValue(settled('DONE', threeEntries, 'Liebe Emma, willkommen!'))
    })

    it('sets the ticks one after another, 2.5 s apart', async () => {
      const wrapper = build()
      await sendThree(wrapper)
      const ticks = () => wrapper.findAll('[data-test="first-creation-tick"]').length
      expect(ticks()).toBe(0)

      // Just short of the beat: still nothing. Without this the assertion below would also
      // pass for ticks that all appear at once.
      await vi.advanceTimersByTimeAsync(2400)
      expect(ticks()).toBe(0)

      await vi.advanceTimersByTimeAsync(100)
      expect(ticks()).toBe(1)
      await vi.advanceTimersByTimeAsync(2500)
      expect(ticks()).toBe(2)
      // The message waits for the last tick -- that is the whole point of the sequence.
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(false)

      await vi.advanceTimersByTimeAsync(2500)
      expect(ticks()).toBe(3)
      expect(wrapper.find('[data-test="first-creation-message"]').text()).toContain('Liebe Emma')
    })

    /**
     * ⚠️ Bernd, 06.09.: "ab dem 4. Beitrag nur noch eine Sekunde". At 2.5 s throughout, ten
     * entries would tick for 25 seconds before the message, the balance and both buttons
     * appear -- longer than the wait that came before them. This way ten take 14.5 s and
     * three, the ordinary case, keep the full ceremony.
     */
    it('keeps the ceremony for the first three and quickens from the fourth', async () => {
      const many = Array.from({ length: 5 }, (unused, index) => entry(`e${index}`))
      submitMock.mockResolvedValue(settled('DONE', many, 'Danke.'))
      const wrapper = build()
      await sendThree(wrapper)
      const ticks = () => wrapper.findAll('[data-test="first-creation-tick"]').length

      await vi.advanceTimersByTimeAsync(7500)
      expect(ticks()).toBe(3)

      // The fourth comes after ONE second, not another two and a half.
      await vi.advanceTimersByTimeAsync(1000)
      expect(ticks()).toBe(4)
      await vi.advanceTimersByTimeAsync(1000)
      expect(ticks()).toBe(5)
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(true)
    })

    it('names the community, not the signer (W4)', async () => {
      const wrapper = build()
      await sendThree(wrapper)
      await vi.runAllTimersAsync()
      const signature = wrapper.find('[data-test="first-creation-signature"]').text()
      expect(signature).toContain('Gemeinschaft')
      expect(signature).toContain('Postfach')
    })

    it('holds the balance back until the layout has answered again', async () => {
      const wrapper = build({ balance: 0, balanceStamp: 1 })
      await sendThree(wrapper)
      await vi.runAllTimersAsync()
      // ⛔ The prop already holds a number here -- the one from BEFORE the creation. Showing
      // it would put a stale, usually zero balance at the moment the window exists for.
      expect(wrapper.find('[data-test="first-creation-balance"]').exists()).toBe(false)

      await wrapper.setProps({ balance: 100, balanceStamp: 2 })
      await nextTick()
      const shown = wrapper.find('[data-test="first-creation-balance"]')
      expect(shown.exists()).toBe(true)
      expect(shown.text()).toContain('100')
    })

    it('asks the layout for a fresh balance exactly once, and only when there was a booking', async () => {
      const wrapper = build()
      await sendThree(wrapper)
      await vi.runAllTimersAsync()
      expect(wrapper.emitted('update-transactions')).toHaveLength(1)
    })

    it('shows the test hint instead of a balance when nothing was booked', async () => {
      submitMock.mockResolvedValue(settled('DONE_UNBOOKED', threeEntries, 'Danke.'))
      const wrapper = build({ balance: 0, balanceStamp: 1 })
      await sendThree(wrapper)
      await vi.runAllTimersAsync()
      await wrapper.setProps({ balance: 100, balanceStamp: 2 })
      await nextTick()

      expect(wrapper.find('[data-test="first-creation-unbooked"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-balance"]').exists()).toBe(false)
      expect(wrapper.emitted('update-transactions')).toBeUndefined()
    })

    it('explains the hundred and offers both ways on', async () => {
      const wrapper = build()
      await sendThree(wrapper)
      await vi.runAllTimersAsync()
      expect(wrapper.find('[data-test="first-creation-result"]').text()).toContain('Warum hundert?')
      expect(wrapper.find('[data-test="first-creation-thank"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-to-account"]').exists()).toBe(true)
    })

    it('sends the member to /send to thank somebody, and closes on the way', async () => {
      const wrapper = build()
      await sendThree(wrapper)
      await vi.runAllTimersAsync()
      await wrapper.find('[data-test="first-creation-thank"]').trigger('click')
      expect(pushed).toEqual(['/send'])
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(false)
      expect(firstLoginWindow.value).toBe(null)
    })
  })

  describe('when a person has to look first (ES-018/019)', () => {
    beforeEach(() => {
      submitMock.mockResolvedValue(
        settled(
          'IN_REVIEW',
          [entry('eins', false)],
          'Deine Einträge schaut sich noch ein Mensch an.',
        ),
      )
    })

    it('shows the notice without a single tick, and without a reason', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await vi.runAllTimersAsync()

      expect(wrapper.find('[data-test="first-creation-review"]').exists()).toBe(true)
      expect(wrapper.findAll('[data-test="first-creation-tick"]')).toHaveLength(0)
      expect(wrapper.find('[data-test="first-creation-review-message"]').text()).toContain(
        'ein Mensch',
      )
      expect(wrapper.find('[data-test="first-creation-balance"]').exists()).toBe(false)
      expect(wrapper.emitted('update-transactions')).toBeUndefined()
      expect(wrapper.find('[data-test="first-creation-thank"]').exists()).toBe(false)
    })

    it('falls back to its own sentence when the server sent no message', async () => {
      submitMock.mockResolvedValue(settled('IN_REVIEW', [entry('eins', false)], null))
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await vi.runAllTimersAsync()
      expect(wrapper.find('[data-test="first-creation-review-message"]').text()).toBe(
        de.firstCreation.review,
      )
    })
  })

  describe('after a walk through the wallet', () => {
    /**
     * ⚠️ Frage null-h: "Jetzt jemandem danken" NAVIGATES, and this component is mounted by
     * DashboardLayout -- so a member who comes back has a fresh instance. What survives has
     * to survive on the server, not in a ref.
     */
    it('comes back on the state the server holds, not on a ref', async () => {
      const first = build()
      await write(first, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await first.find('[data-test="first-creation-save"]').trigger('click')
      await vi.runAllTimersAsync()
      expect(first.find('[data-test="first-creation-result"]').exists()).toBe(true)
      first.unmount()
      expect(firstLoginWindow.value).toBe(null)

      // The server now says: done, and no longer eligible. So no window.
      statusMock.value = {
        firstCreationStatus: status({ state: 'DONE', eligible: false, entries: [entry('eins')] }),
      }
      const second = build()
      expect(second.find('[data-test="first-creation"]').exists()).toBe(false)
      expect(firstLoginWindow.value).toBe(null)
    })

    it('comes back with the question when nothing was entered (ES-011)', async () => {
      const first = build()
      await first.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      // The project-account question stands in between the first time (ES-012); "Later".
      await first.find('[data-test="first-creation-later"]').trigger('click')
      await vi.runAllTimersAsync()
      first.unmount()

      // Skipping writes no row: the server still calls the member eligible.
      const second = build()
      expect(second.find('[data-test="first-creation-form"]').exists()).toBe(true)
    })
  })
})
