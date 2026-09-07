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
  //
  // ⛔ The footer here carries the ONE trait of the real BModal that this window keeps
  // tripping over: Cancel and OK are the FALLBACK of the footer slot, so a slot that
  // renders nothing gets them (`renderSlot($slots, 'footer', …, () => [cancel, ok])` in
  // bootstrap-vue-next 0.26.8, and vue falls back on comment-only content -- which is what
  // a chain of false `v-if`s leaves). A stub without the fallback answers every question
  // about the footer with "looks fine", including the one that was wrong on screen.
  //
  // `noFooter` is declared for the same reason: a stub takes any attribute, so the test
  // could not otherwise tell a prop that works from one this library does not have.
  BModal: {
    name: 'BModal',
    props: ['modelValue', 'noFooter'],
    template: `<div v-if="modelValue">
      <slot></slot>
      <div v-if="!noFooter" class="modal-footer">
        <slot name="footer">
          <button data-test="bvn-cancel">Cancel</button>
          <button data-test="bvn-ok">OK</button>
        </slot>
      </div>
    </div>`,
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
// The two-step confirmation has a spec of its own; here it is a stub the test answers
// through, so what is measured is that nothing is declared WITHOUT it.
vi.mock('@/components/UserSettings/ProjectAccountConfirm.vue', () => ({
  default: {
    props: ['mode', 'busy'],
    emits: ['confirm', 'cancel'],
    template:
      '<div data-test="confirm-stub"><button data-test="confirm-yes" @click="$emit(`confirm`)" /><button data-test="confirm-no" @click="$emit(`cancel`)" /></div>',
  },
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
/** The opening the box carries for `helpedSickPerson`, as the window builds it. */
const sickStem = 'Ich habe einem kranken Menschen geholfen, indem ich '

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

    /**
     * ⭐ Bernd, 07.09.: the window came through the door with the question. The greeting,
     * the reason for the question and the offer that the beginning is already prepared now
     * stand ahead of it, IN THAT ORDER -- an intro that arrived below its question would be
     * an explanation nobody reads.
     */
    it('says why it is asking before it asks, and offers the beginning', () => {
      const wrapper = build()
      const intro = wrapper.find('[data-test="first-creation-intro"]')
      expect(intro.exists()).toBe(true)
      expect(intro.text()).toContain('Gemeinwohl')
      expect(intro.text()).toContain('Deinen Anfang haben wir Dir schon vorbereitet.')

      const html = wrapper.html()
      expect(html.indexOf('first-creation-welcome')).toBeLessThan(
        html.indexOf('first-creation-intro'),
      )
      expect(html.indexOf('first-creation-intro')).toBeLessThan(
        html.indexOf('Was hast Du in den vergangenen Wochen'),
      )
    })

    it('asks the question plainly and offers the sentences rather than demanding them', () => {
      const form = build().find('[data-test="first-creation-form"]').text()
      // "für das Gemeinwohl" moved up into the intro: the question no longer carries it.
      expect(form).toContain('Was hast Du in den vergangenen Wochen schon Gutes getan?')
      expect(form).not.toContain('schon Gutes für das Gemeinwohl getan')
      // And the line under it says the sentences may be reshaped -- since #3857 the box
      // carries the opening, so "vervollständige" was no longer the whole truth.
      expect(form).toContain('Du kannst sie ergänzen, umformen oder ganz eigene schreiben.')
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

    /**
     * ⚠️ The wallet's own half of the child tick. The window loops over the key list, so the
     * new tick needed no code here — and that is exactly why it needs a test: nothing in
     * the compiler or the linter would notice if the key fell out of the list again, and
     * the catalog guard next door holds the LISTS against each other, not the screen.
     */
    it('offers the child tick beside the retiree one, and sends it', async () => {
      const wrapper = build()
      const child = wrapper.find('[data-test="first-creation-check-child"]')
      expect(child.exists()).toBe(true)
      expect(child.text()).toContain('Ich bin ein Kind.')
      expect(child.text()).toContain('Auch Deine Zeit zählt.')

      await child.trigger('click')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')

      // A tick is an entry with no text of its own (ES-008).
      expect(submitMock).toHaveBeenCalledWith({
        entries: [{ catalogKey: 'child', text: null }],
      })
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
    /**
     * ⭐ The whole of this delivery, in one test (Bernd, 06.09.). The box used to hold an
     * example as a PLACEHOLDER -- one that belonged to a different stem, and one nobody
     * could edit, so whoever wrote in the box was locked into a grammar somebody else had
     * chosen. The sentence now starts IN the box, as a value, and every word of it is
     * theirs.
     */
    it('opens the box with the sentence already in it, ready to be changed', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-stem-helpedSickPerson"]').trigger('click')
      await nextTick()

      const field = wrapper.findAll('[data-test^="first-creation-text-"]').at(-1)
      expect(field.element.value).toBe('Ich habe einem kranken Menschen geholfen, indem ich ')

      // Completed: the opening stays and their words follow it.
      await field.setValue('Ich habe einem kranken Menschen geholfen, indem ich ihn zum Arzt fuhr')
      await nextTick()
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      expect(submitMock).toHaveBeenCalledWith({
        entries: [
          {
            catalogKey: 'helpedSickPerson',
            text: 'Ich habe einem kranken Menschen geholfen, indem ich ihn zum Arzt fuhr',
          },
        ],
      })
    })

    /**
     * ⛔ The row says the stem and nothing else. It used to echo the member's words behind
     * the connector, because the sentence lived out there and only its tail was in the box.
     * With the whole sentence in the box, an echo would print it twice — and the copy in
     * the row is the one nobody can edit.
     */
    it('leaves the sentence in the box and does not repeat it in the row', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedSickPerson', `${sickStem}ihn zum Arzt gefahren habe`)

      const row = wrapper.find('[data-test="first-creation-stem-helpedSickPerson"]').text()
      expect(row).toBe('Ich habe einem kranken Menschen geholfen,')
      expect(row).not.toContain('zum Arzt')
      // And the "…" that used to stand in for the missing tail is gone with it.
      expect(row).not.toContain('…')
    })

    /**
     * ⛔ The other half of the freedom, and the one the old build made impossible: the
     * member throws the opening away. Bernd's own example -- "Ich habe meinem kranken
     * Bruder Vitamin-Tabletten gekauft" is a whole sentence with no "indem ich" in it.
     */
    it('lets the whole sentence be replaced, opening and all', async () => {
      const wrapper = build()
      await write(
        wrapper,
        'helpedSickPerson',
        'Ich habe meinem kranken Bruder Vitamin-Tabletten gekauft',
      )
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')

      expect(submitMock).toHaveBeenCalledWith({
        entries: [
          {
            catalogKey: 'helpedSickPerson',
            text: 'Ich habe meinem kranken Bruder Vitamin-Tabletten gekauft',
          },
        ],
      })
    })

    /**
     * ⛔ An untouched opening is an empty entry, not a finished one. It is eight words, so
     * a plain word count would call it written -- and Save would be within reach of
     * somebody who has typed nothing at all.
     */
    it('counts an untouched opening as nothing written', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-stem-helpedSickPerson"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="first-creation-count"]').text()).toContain('0')
      expect(wrapper.find('[data-test="first-creation-save"]').attributes('disabled')).toBeDefined()
      // Nor is it a half-written one: no reproach under a box nobody has touched.
      expect(wrapper.find('[data-test^="first-creation-short-"]').exists()).toBe(false)
    })

    /**
     * ⛔ One backspace at the end of an untouched box, which is a natural thing to do. It
     * used to end the prefix match, so the opening counted as the member's own eight words
     * — Save went live and an entry carrying nothing but the stem could be filed.
     */
    it('still counts nothing written when the opening loses its last space', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedSickPerson', sickStem.trimEnd())

      expect(wrapper.find('[data-test="first-creation-count"]').text()).toContain('0')
      expect(wrapper.find('[data-test="first-creation-save"]').attributes('disabled')).toBeDefined()
    })

    /**
     * And the floor still holds for the ordinary path: two words behind the opening are
     * too few, and the reason stands at the box rather than at the pale button.
     */
    it('measures the floor against what the member added, not against the opening', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedSickPerson', `${sickStem}ihn fuhr`)
      expect(wrapper.find('[data-test^="first-creation-short-"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-save"]').attributes('disabled')).toBeDefined()

      // ⚠️ The SAME box, not another `write`: that one opens a second entry, and the first
      // one's reproach would still be on screen -- the test would then prove nothing.
      const field = wrapper.findAll('[data-test^="first-creation-text-"]').at(-1)
      await field.setValue(`${sickStem}ihn zum Arzt gefahren habe`)
      await nextTick()
      expect(wrapper.find('[data-test^="first-creation-short-"]').exists()).toBe(false)
      expect(
        wrapper.find('[data-test="first-creation-save"]').attributes('disabled'),
      ).toBeUndefined()
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

    /**
     * ⭐ Bernd, 07.09.: "Rentner" and "Kind" exclude each other, and the window is the first
     * of three places that says so. Setting one takes the other away — a tap that visibly
     * did nothing would read as a broken window, and both standing would send the bundle to
     * a moderator for nothing.
     */
    it('lets one of two excluding ticks take the other´s place', async () => {
      const wrapper = build()
      const retiree = () => wrapper.find('[data-test="first-creation-check-retiree"]')
      const child = () => wrapper.find('[data-test="first-creation-check-child"]')

      await retiree().trigger('click')
      expect(retiree().attributes('aria-pressed')).toBe('true')

      await child().trigger('click')
      expect(child().attributes('aria-pressed')).toBe('true')
      expect(retiree().attributes('aria-pressed')).toBe('false')
      // One entry, not two: the exchange is a correction, not an addition. (The German
      // singular has no digit in it -- "ein Eintrag" -- so the word is what to look for.)
      expect(wrapper.find('[data-test="first-creation-count"]').text()).toBe('ein Eintrag')

      // And back again, so this is an exchange and not "child wins".
      await retiree().trigger('click')
      expect(retiree().attributes('aria-pressed')).toBe('true')
      expect(child().attributes('aria-pressed')).toBe('false')

      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      expect(submitMock).toHaveBeenCalledWith({
        entries: [{ catalogKey: 'retiree', text: null }],
      })
    })

    /**
     * ⚠️ The exchange must not be stopped by the ceiling: it opens no slot, so a member at
     * ten entries can still say which of the two they are. Checking the cap before dropping
     * the other tick would have made the tap do nothing, silently — the very thing this
     * window has been repaired for once already.
     */
    it('still swaps the two ticks when the entries are at their ceiling', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-check-retiree"]').trigger('click')
      await write(wrapper, 'helpedParish', 'einmal geholfen habe')
      for (let index = 0; index < 12; index++) {
        const again = wrapper.find('[data-test="first-creation-again-helpedParish"]')
        if (!again.exists()) break
        await again.trigger('click')
        const fields = wrapper.findAll('[data-test^="first-creation-text-"]')
        await fields[fields.length - 1].setValue('noch einmal geholfen habe')
      }
      expect(wrapper.find('[data-test="first-creation-max"]').exists()).toBe(true)

      await wrapper.find('[data-test="first-creation-check-child"]').trigger('click')
      expect(
        wrapper.find('[data-test="first-creation-check-child"]').attributes('aria-pressed'),
      ).toBe('true')
      expect(
        wrapper.find('[data-test="first-creation-check-retiree"]').attributes('aria-pressed'),
      ).toBe('false')
    })

    /**
     * ⛔ The second of the three layers, and it is unreachable through the toggle above --
     * on purpose. The toggle is one line; the day somebody restores `checked` from a draft
     * or keeps the array through a refactor and loses the exchange, Save must not send a
     * bundle the server will hand straight to a moderator.
     */
    it('holds Save when both excluding ticks are set anyway', async () => {
      const wrapper = build()
      wrapper.vm.checked = ['retiree', 'child']
      await nextTick()
      expect(wrapper.find('[data-test="first-creation-count"]').text()).toContain('2')
      // The state really is the forbidden one -- otherwise a disabled Save would prove
      // nothing but that the window is empty.
      expect(
        wrapper.find('[data-test="first-creation-check-child"]').attributes('aria-pressed'),
      ).toBe('true')
      expect(wrapper.find('[data-test="first-creation-save"]').attributes('disabled')).toBeDefined()

      // The counter-check: one of them alone and Save is alive, so this is the pair being
      // held back and not the ticks in general.
      wrapper.vm.checked = ['retiree']
      await nextTick()
      expect(
        wrapper.find('[data-test="first-creation-save"]').attributes('disabled'),
      ).toBeUndefined()
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

  /**
   * ⛔ Bernd, 07.09.: the window showed "Cancel" / "OK", untranslated, in the middle of the
   * act. Not a text of ours -- BModal's own footer, which it falls back to whenever the
   * footer slot renders nothing (the stub at the top of this file carries that trait, and
   * without it none of these tests could tell the difference).
   *
   * Every assertion here has its counterpart: a screen with no buttons has no footer AND a
   * screen with buttons has one. An "it is not there" alone would stay green if the footer
   * were switched off everywhere.
   */
  describe('the footer', () => {
    const foreignButtons = (wrapper) => [
      wrapper.find('[data-test="bvn-cancel"]').exists(),
      wrapper.find('[data-test="bvn-ok"]').exists(),
    ]

    it('is the window´s own on the form, never BModal´s', () => {
      const wrapper = build()
      expect(wrapper.find('.modal-footer').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-save"]').exists()).toBe(true)
      expect(foreignButtons(wrapper)).toEqual([false, false])
    })

    it('is gone while the answer is out, and comes back when the way out does', async () => {
      let release
      submitMock.mockImplementation(
        () => new Promise((resolve) => (release = () => resolve(settled('DONE', [entry('a')])))),
      )
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="first-creation-waiting"]').exists()).toBe(true)
      expect(wrapper.find('.modal-footer').exists()).toBe(false)
      expect(foreignButtons(wrapper)).toEqual([false, false])

      release()
      await vi.runAllTimersAsync()
      // The other half: once there IS something to press, the bar is back with our button.
      expect(wrapper.find('.modal-footer').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-to-account"]').exists()).toBe(true)
      expect(foreignButtons(wrapper)).toEqual([false, false])
    })

    it('stays away through the ticks and the pause before the message', async () => {
      // ⚠️ This is the stretch Bernd saw: #3855 gave the last tick a 2.5 s pause of its own,
      // which put the empty footer squarely in front of somebody who was looking at it.
      submitMock.mockResolvedValue(settled('DONE', [entry('eins'), entry('zwei')], 'Danke.'))
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen für das Fest gebacken habe')
      await wrapper.find('[data-test="first-creation-save"]').trigger('click')
      await nextTick()
      await nextTick()

      expect(wrapper.find('[data-test="first-creation-result"]').exists()).toBe(true)
      expect(wrapper.find('.modal-footer').exists()).toBe(false)

      // After both ticks, still in the pause: the message is not there yet, and neither is
      // anything to press.
      await vi.advanceTimersByTimeAsync(5000)
      expect(wrapper.findAll('[data-test="first-creation-tick"]')).toHaveLength(2)
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(false)
      expect(wrapper.find('.modal-footer').exists()).toBe(false)
      expect(foreignButtons(wrapper)).toEqual([false, false])

      await vi.advanceTimersByTimeAsync(2500)
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(true)
      expect(wrapper.find('.modal-footer').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-thank"]').exists()).toBe(true)
    })

    it('leaves the project confirmation its own two buttons and no others', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="first-creation-project-account"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="confirm-stub"]').exists()).toBe(true)
      expect(wrapper.find('.modal-footer').exists()).toBe(false)
      expect(foreignButtons(wrapper)).toEqual([false, false])
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

    it('sends one skip however often "Later" is tapped while the first is out', async () => {
      let release
      skipMock.mockImplementation(() => new Promise((resolve) => (release = resolve)))
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      const later = wrapper.find('[data-test="first-creation-later"]')
      await later.trigger('click')
      await later.trigger('click')
      await wrapper.find('[data-test="first-creation-project-account"]').trigger('click')
      expect(skipMock).toHaveBeenCalledTimes(1)
      expect(declareMock).not.toHaveBeenCalled()
      expect(later.attributes('disabled')).toBeDefined()
      release({})
      await vi.runAllTimersAsync()
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(false)
    })

    it('"This is a project account" opens the two-step confirmation and declares nothing yet', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="first-creation-project-account"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="first-creation-project-confirm"]').exists()).toBe(true)
      expect(declareMock).not.toHaveBeenCalled()
      // Cancelling goes back to the question, not out of the window.
      await wrapper.find('[data-test="confirm-no"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="first-creation-project-ask"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(true)
    })

    it('"This is a project account" declares it, tells the store and closes without a skip', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="first-creation-project-account"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="confirm-yes"]').trigger('click')
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
      await nextTick()
      await wrapper.find('[data-test="confirm-yes"]').trigger('click')
      await vi.runAllTimersAsync()
      expect(wrapper.find('[data-test="first-creation-project-confirm"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="first-creation-project-failed"]').text()).toBe(
        de.settings.creationAccount.openContributions,
      )
      expect(storeState.creationAllowed).toBe(true)
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(true)

      // Back to the question and in again: the old refusal does not come along.
      await wrapper.find('[data-test="confirm-no"]').trigger('click')
      await nextTick()
      await wrapper.find('[data-test="first-creation-project-account"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="first-creation-project-failed"]').exists()).toBe(false)
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
      // ⛔ Line by line and EXACTLY, not `toContain` on the whole screen. The box carries
      // the opening now, so a screen that glued the stem in front once more would show the
      // sentence twice — and a `toContain` would have stayed green through it. Injection:
      // put the stem back in front in `pendingLines` and this falls.
      const lines = wrapper
        .findAll('[data-test^="first-creation-pending-"]')
        .map((line) => line.text())
      expect(lines).toEqual(['Ich bin Rentnerin / Rentner.', 'Kuchen für das Fest gebacken habe'])
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
      // ⛔ And STILL not the message. The last tick used to be the only one nobody saw --
      // message, balance and both buttons arrived in the frame that drew it (Bernd, 06.09.).
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(false)

      await vi.advanceTimersByTimeAsync(2400)
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(false)
      await vi.advanceTimersByTimeAsync(100)
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

      // ⛔ But the CLOSING pause stays at the ceremony length, however fast the ticks ran
      // (Bernd, 06.09.). The pace exists to keep ten entries short; this pause exists so
      // that the last of them is seen, and one second is not enough for that.
      await vi.advanceTimersByTimeAsync(1000)
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(false)
      await vi.advanceTimersByTimeAsync(1500)
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(true)
    })

    /**
     * ⛔ The order, not the presence. Both blocks were there before; the box sat directly
     * under the sentence about "your first hundred" and showed the ACCOUNT — which is the
     * hundred only for somebody who arrived with an empty one. Whoever redeemed a link or
     * a cheque first read a larger number there, and "why a hundred?" underneath answered
     * a question they were no longer asking (Bernd, 06.09.).
     */
    it('puts why-a-hundred above the account, not below it', async () => {
      const wrapper = build({ balance: 0, balanceStamp: 1 })
      await sendThree(wrapper)
      await vi.runAllTimersAsync()
      await wrapper.setProps({ balance: 299.95, balanceStamp: 2 })
      await nextTick()

      const html = wrapper.html()
      const why = html.indexOf('Warum hundert?')
      const box = html.indexOf('first-creation-balance')
      expect(why).toBeGreaterThan(-1)
      expect(box).toBeGreaterThan(-1)
      expect(why).toBeLessThan(box)
    })

    /**
     * ⭐ Bernd, 07.09.: who confirmed THIS one, and who confirms every one after it. It
     * stands after the "read more" link so that sentence keeps pointing at the common good
     * rather than appearing to point at the moderation -- hence the order assertion, which
     * is the whole of the placement decision.
     */
    it('says the software confirmed this one and a human reads the next', async () => {
      const wrapper = build()
      await sendThree(wrapper)
      await vi.runAllTimersAsync()

      const confirmed = wrapper.find('[data-test="first-creation-why-confirmed"]')
      expect(confirmed.exists()).toBe(true)
      expect(confirmed.text()).toContain('hat die Software gleich bestätigt')
      expect(confirmed.text()).toContain('liest ein Mensch mit')

      const html = wrapper.html()
      expect(html.indexOf('first-creation-why-more-link')).toBeLessThan(
        html.indexOf('first-creation-why-confirmed'),
      )
    })

    /**
     * ⚠️ Measured at the rendered anchor, not at the locale key: the sentence is put
     * together by `i18n-t`, and a component that fails to resolve renders NOTHING while
     * every other test stays green.
     */
    it('hangs the link on the word and opens it in a new tab', async () => {
      const wrapper = build()
      await sendThree(wrapper)
      await vi.runAllTimersAsync()

      const link = wrapper.find('[data-test="first-creation-why-more-link"]')
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe('hier')
      // No language prefix: gradido.net follows the browser on its own, and a `/de/` glued
      // on here would hand a Greek reader the German page.
      expect(link.attributes('href')).toBe('https://gradido.net/gemeinwohl-was-ist-das/')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toContain('noopener')
      // The address itself belongs on the word, not in the running text beside it.
      expect(wrapper.find('[data-test="first-creation-message-block"]').text()).not.toContain(
        'https://',
      )
    })

    /**
     * ⛔ Both of these were found by deleting the line, not by writing the test first: with
     * `messageShown.value = false` taken out of the watcher, and with the zero-entry branch
     * taken out, all 48 tests here stayed green. Two lines carrying behaviour with nothing
     * watching them — the reset and the branch are wiring, and wiring almost never has a
     * test, because one spec stubs it and the other takes it for granted.
     */
    it('starts the ceremony over when the screen is entered again', async () => {
      // ⚠️ Driven from the server answer, NOT through Save: sending sets `settled`, and
      // that holds the result screen for good — a test that submits first can never leave
      // it again and would prove nothing about coming back.
      const done = status({
        state: 'DONE',
        eligible: false,
        entries: threeEntries,
        message: 'Liebe Emma, willkommen!',
      })
      // The window has to be OPENED first -- `eligible` opens it and does not keep it open.
      statusMock.value = { firstCreationStatus: status({ state: 'FORCED', eligible: true }) }
      const wrapper = build()
      await nextTick()
      statusMock.value = { firstCreationStatus: done }
      await vi.runAllTimersAsync()
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(true)

      // Away and back: what a forced run does after a function test.
      statusMock.value = { firstCreationStatus: status({ state: 'FORCED', eligible: true }) }
      await nextTick()
      statusMock.value = { firstCreationStatus: done }
      await nextTick()

      // ⛔ Not the message from the run before, standing over three empty circles.
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-test="first-creation-tick"]')).toHaveLength(0)

      await vi.runAllTimersAsync()
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(true)
    })

    it('shows the message at once when there is no tick to wait for', async () => {
      const wrapper = build()
      statusMock.value = {
        firstCreationStatus: status({
          state: 'DONE',
          eligible: true,
          entries: [],
          message: 'Liebe Emma, willkommen!',
        }),
      }
      await nextTick()

      // No entries, no ticks, so no pause belongs to anything: without the branch the
      // window would sit empty for good.
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
