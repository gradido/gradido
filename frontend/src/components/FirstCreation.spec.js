// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
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

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: statusMock, refetch: refetchMock }),
  useMutation: (document) => ({
    mutate: (variables) =>
      document === 'SUBMIT_FIRST_CREATION' ? submitMock(variables) : skipMock(variables),
  }),
}))

vi.mock('@/graphql/firstCreation.graphql', () => ({
  firstCreationStatus: 'FIRST_CREATION_STATUS',
  submitFirstCreation: 'SUBMIT_FIRST_CREATION',
  skipFirstCreation: 'SKIP_FIRST_CREATION',
}))

const i18n = createI18n({ locale: 'de', legacy: false, messages: { de } })

const status = (over = {}) => ({
  state: 'NONE',
  eligible: true,
  message: null,
  entries: [],
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
  pushed.length = 0
  statusMock.value = { firstCreationStatus: status() }
  refetchMock.mockReset()
  answerRefetchWith(status())
  submitMock.mockReset().mockResolvedValue(settled('DONE', [entry('eins')], 'Danke.'))
  skipMock.mockReset().mockResolvedValue({})
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

    it('holds Save while an opened field has fewer than three words', async () => {
      const wrapper = build()
      await write(wrapper, 'helpedParish', 'Kuchen')
      expect(wrapper.find('[data-test="first-creation-save"]').attributes('disabled')).toBeDefined()

      await write(wrapper, 'helpedParish', '')
      const fields = wrapper.findAll('[data-test^="first-creation-text-"]')
      await fields[0].setValue('Kuchen für das Fest gebacken habe')
      await nextTick()
      // Still held: the SECOND field is empty. Every open field counts, not just one.
      expect(wrapper.find('[data-test="first-creation-save"]').attributes('disabled')).toBeDefined()

      await fields[1].setValue('für die Kinder gekocht habe')
      await nextTick()
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

    it('calls skipFirstCreation and closes on "nothing comes to mind"', async () => {
      const wrapper = build()
      await wrapper.find('[data-test="first-creation-nothing"]').trigger('click')
      await vi.runAllTimersAsync()
      expect(skipMock).toHaveBeenCalledTimes(1)
      expect(submitMock).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="first-creation"]').exists()).toBe(false)
      expect(firstLoginWindow.value).toBe(null)
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

    it('sets the ticks one after another, 250 ms apart', async () => {
      const wrapper = build()
      await sendThree(wrapper)
      expect(wrapper.findAll('[data-test="first-creation-tick"]')).toHaveLength(0)

      await vi.advanceTimersByTimeAsync(250)
      expect(wrapper.findAll('[data-test="first-creation-tick"]')).toHaveLength(1)
      await vi.advanceTimersByTimeAsync(250)
      expect(wrapper.findAll('[data-test="first-creation-tick"]')).toHaveLength(2)
      // The message waits for the last tick -- that is the whole point of the sequence.
      expect(wrapper.find('[data-test="first-creation-message"]').exists()).toBe(false)

      await vi.advanceTimersByTimeAsync(250)
      expect(wrapper.findAll('[data-test="first-creation-tick"]')).toHaveLength(3)
      expect(wrapper.find('[data-test="first-creation-message"]').text()).toContain('Liebe Emma')
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
      await vi.runAllTimersAsync()
      first.unmount()

      // Skipping writes no row: the server still calls the member eligible.
      const second = build()
      expect(second.find('[data-test="first-creation-form"]').exists()).toBe(true)
    })
  })
})
