import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick, ref, watch } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import AliasFirstChoice from './AliasFirstChoice.vue'

vi.mock('bootstrap-vue-next', () => ({
  BButton: { template: '<button @click="$emit(`click`)"><slot></slot></button>' },
  BFormInput: {
    props: ['modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />',
  },
  // Named, so a test can reach it and close the window the way the member does -- from
  // the outside, through `v-model`, not by calling something on the component.
  BModal: {
    name: 'BModal',
    props: ['modelValue'],
    template: '<div v-if="modelValue"><slot></slot><slot name="footer"></slot></div>',
  },
}))

const statusMock = ref({ aliasStatus: { aliasSettled: false } })
const refetchMock = vi.fn()
const adoptMock = vi.fn()
const updateMock = vi.fn()

// The fake server behind the name check. What a test can set:
const takenNames = ref([]) // words it answers "already taken" for
const failingNames = ref([]) // words the query fails on
const holdAnswer = ref(false) // hold the answer back, so it is "on its way"
const asked = ref([]) // every word a question actually went out for

vi.mock('@vue/apollo-composable', () => ({
  /**
   * ⛔ This mock exists in this shape on purpose, and the shape is the point.
   *
   * The one it replaced took only the document and threw BOTH getters away. With it,
   * all three terms of `enabled` -- `checkEnabled`, `formatValid` and
   * `probed === typed` -- could be deleted one by one and every test stayed green,
   * because a question that never went out looked exactly like one that did.
   *
   * So this one calls both getters the way apollo does: `enabled` decides whether a
   * question is asked at all, and the answer is tied to the WORD it was asked about.
   * It also copies the one apollo behaviour this window turns on -- a failed query
   * sets `error` and drops `loading` and leaves the previous answer sitting in
   * `result` (see `processError` in @vue/apollo-composable).
   */
  useQuery: vi.fn((query, variables, options) => {
    if (query === 'ALIAS_STATUS') {
      return { result: statusMock, loading: ref(false), error: ref(null), refetch: refetchMock }
    }

    const result = ref(undefined)
    const loading = ref(false)
    const error = ref(null)

    watch(
      () => [options().enabled, variables().username],
      ([enabled, username]) => {
        if (!enabled) {
          // Not asked, so nothing changes -- `result` keeps the answer to the word
          // before this one, which is exactly the trap `available` has to avoid.
          loading.value = false
          return
        }
        asked.value.push(username)
        if (holdAnswer.value) {
          loading.value = true
          return
        }
        loading.value = false
        if (failingNames.value.includes(username)) {
          error.value = new Error('check failed')
          return
        }
        error.value = null
        result.value = { checkUsername: !takenNames.value.includes(username) }
      },
      { immediate: true, flush: 'sync' },
    )

    return { result, loading, error, refetch: refetchMock }
  }),
  useMutation: vi.fn((mutation) => ({
    mutate: mutation === 'ADOPT' ? adoptMock : updateMock,
  })),
}))

vi.mock('@/graphql/user.graphql', () => ({ aliasStatus: 'ALIAS_STATUS' }))
vi.mock('@/graphql/queries', () => ({ checkUsername: 'CHECK_USERNAME' }))
vi.mock('@/graphql/mutations', () => ({ adoptAlias: 'ADOPT', updateUserInfos: 'UPDATE' }))
vi.mock('@/config', () => ({ default: { COMMUNITY_URL: 'https://gradido.net' } }))

const toastErrorMock = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: toastErrorMock, toastSuccess: vi.fn() }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'settings.username.first-title': 'Your username',
      'settings.username.first-intro': 'So that others can find you:',
      'settings.username.first-hint': 'You can keep it or pick your own.',
      'settings.username.first-keep': 'Keep it',
      'settings.username.first-other': 'Pick another',
      'settings.username.first-choose-title': 'Choose a name',
      'settings.username.first-free': 'is still free',
      'settings.username.first-taken': 'This name is already taken',
      'settings.username.first-invalid': 'This name does not match the rules',
      'settings.username.first-check-failed': 'could not be checked',
      'settings.username.first-rules': '3 to 20 characters',
      'settings.username.first-checking': 'checking ...',
      'settings.username.first-back': 'Back',
      'form.username': 'Username',
      'form.save': 'Save',
    },
  },
})

const mountComponent = (username = 'BerndH') =>
  mount(AliasFirstChoice, {
    global: {
      plugins: [
        createStore({
          state: () => ({ username }),
          mutations: { username: (state, value) => (state.username = value) },
        }),
        i18n,
      ],
    },
  })

describe('AliasFirstChoice', () => {
  let wrapper

  // The field asks the server through a 300 ms debounce, so a test that only sets a
  // value is still standing in the gap before the question goes out. Typing and then
  // walking the clock forward is what a member does by pausing.
  const type = async (value) => {
    await wrapper.find('[data-test="alias-first-input"]').setValue(value)
    vi.advanceTimersByTime(350)
    await nextTick()
  }

  // Everything the status line is saying right now, by name. The row itself is an
  // unconditional div, so asking whether it EXISTS answers nothing; what it says is
  // the part that can be wrong.
  const statusSays = () =>
    wrapper.findAll('.alias-first-status [data-test]').map((el) => el.attributes('data-test'))

  const saveDisabled = () =>
    wrapper.find('[data-test="alias-first-save"]').attributes('disabled') !== undefined

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    statusMock.value = { aliasStatus: { aliasSettled: false } }
    takenNames.value = []
    failingNames.value = []
    holdAnswer.value = false
    asked.value = []
    wrapper = mountComponent()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Only a member still holding a name the system built for them has anything to
  // answer here.
  it('stays away from somebody who already picked their name', () => {
    statusMock.value = { aliasStatus: { aliasSettled: true } }
    wrapper = mountComponent()

    expect(wrapper.find('[data-test="alias-first-choice"]').exists()).toBe(false)
  })

  it('shows the proposal to somebody who has not', () => {
    expect(wrapper.find('[data-test="alias-proposal"]').text()).toBe('BerndH')
  })

  // The address is what the name is for, and it is shown in the shape it takes on
  // paper - host, /u/, name, no scheme.
  it('shows what the name will be used as', () => {
    expect(wrapper.text()).toContain('gradido.net/u/')
  })

  describe('keeping the proposal', () => {
    it('takes the name and closes', async () => {
      await wrapper.find('[data-test="alias-first-keep"]').trigger('click')

      expect(adoptMock).toHaveBeenCalled()
      expect(wrapper.find('[data-test="alias-first-choice"]').exists()).toBe(false)
    })
  })

  describe('picking another', () => {
    beforeEach(async () => {
      await wrapper.find('[data-test="alias-first-other"]').trigger('click')
    })

    it('offers a field prefilled with the proposal', () => {
      expect(wrapper.find('[data-test="alias-first-input"]').element.value).toBe('BerndH')
    })

    it('refuses to save a name that is taken', async () => {
      takenNames.value = ['taken']
      await type('taken')

      expect(statusSays()).toEqual(['alias-first-taken'])
      expect(saveDisabled()).toBe(true)
    })

    // A name that is too short is not a name somebody else holds. Saying "taken" sends
    // the member looking for another word when the word was fine, and it is the very
    // first thing the wallet ever tells them.
    //
    // The assertion that carries this is the one about `asked`: the shape check is what
    // keeps a word that CANNOT be free from costing a round trip, and it is the term of
    // `enabled` that no test could see before.
    it('says a short name has the wrong shape, and does not ask about it', async () => {
      await type('Bernd')
      expect(statusSays()).toEqual(['alias-first-free'])

      await type('ab')

      expect(asked.value).not.toContain('ab')
      expect(statusSays()).toEqual(['alias-first-invalid'])
      expect(saveDisabled()).toBe(true)
    })

    // The answer in hand belongs to the word typed before this one. Leaving it on
    // screen while the next answer is on its way is how a name that turns out to be
    // taken keeps a green Save button for the length of a round trip - and the member
    // gets a bare error code for clicking what the window told them to click.
    //
    // Mid-debounce on purpose: no query has gone out for "Peter" yet, so the only thing
    // standing between the member and a false green light is `probed === typed`.
    it('trusts no answer while the next word has not been asked about', async () => {
      await type('Bernd')
      expect(statusSays()).toEqual(['alias-first-free'])
      expect(saveDisabled()).toBe(false)

      await wrapper.find('[data-test="alias-first-input"]').setValue('Peter')

      expect(asked.value).not.toContain('Peter')
      expect(statusSays()).toEqual(['alias-first-checking'])
      expect(saveDisabled()).toBe(true)
    })

    // Same trap, the other half: the question has gone out and the answer is not back.
    it('trusts no answer while the next one is on its way', async () => {
      await type('Bernd')

      holdAnswer.value = true
      await type('Peter')

      expect(asked.value).toContain('Peter')
      expect(statusSays()).toEqual(['alias-first-checking'])
      expect(saveDisabled()).toBe(true)
    })

    /**
     * ⛔ A failed query is not an absent answer. Apollo sets `error`, drops `loading`
     * and leaves the PREVIOUS answer in `result` -- so a window that reads `result`
     * without reading `error` hands the answer for "Bernd" to "Peter": a green "still
     * free" for a name that may well be taken, with Save armed behind it.
     *
     * And the way out matters as much as the message. The server decides in the end,
     * so a check that could not run must not lock the button: the only other exit
     * leaves the question open and brings the window back at the next login.
     */
    it('says so when the name could not be checked, instead of a green light', async () => {
      await type('Bernd')
      expect(statusSays()).toEqual(['alias-first-free'])

      failingNames.value = ['Peter']
      await type('Peter')

      expect(statusSays()).toEqual(['alias-first-check-failed'])
      expect(saveDisabled()).toBe(false)
    })

    /**
     * ⛔ The same trap one floor down, and coderabbit found it in the fix for the trap
     * above: apollo clears `error` when a query STARTS, not when it is switched off. So
     * in the 300 ms between a keystroke and the debounce, the failure of the PREVIOUS
     * word is still standing -- and a `checkFailed` that does not compare `probed` with
     * `typed` reports it about a word nothing was ever asked about. Since a failed check
     * hands Save back to the server, that would arm the button as well.
     */
    it('does not carry a failure over to the next, unasked word', async () => {
      failingNames.value = ['Klaus']
      await type('Klaus')
      expect(statusSays()).toEqual(['alias-first-check-failed'])

      await wrapper.find('[data-test="alias-first-input"]').setValue('Peter')

      expect(asked.value).not.toContain('Peter')
      expect(statusSays()).toEqual(['alias-first-checking'])
      expect(saveDisabled()).toBe(true)
    })

    it('saves a free one and closes', async () => {
      await type('Bernd')
      await wrapper.find('[data-test="alias-first-save"]').trigger('click')

      expect(updateMock).toHaveBeenCalledWith({ alias: 'Bernd' })
      expect(wrapper.find('[data-test="alias-first-choice"]').exists()).toBe(false)
    })

    /**
     * ⛔ The reported bug: the field twitched on every keystroke and every deletion.
     *
     * The three messages were three v-ifs that could all be false at once -- exactly
     * between a keystroke and its answer -- so the whole line vanished and the address
     * and the rules below it jumped up and back. A member typing a nine-letter name saw
     * it nine times.
     *
     * So the invariant is not that the row exists -- it is an unconditional div and
     * always does, which is why the test that asserted THAT could never fall. It is
     * that the chain has an answer for every state the member can reach: from the
     * moment they have typed something of their own, the line says exactly one thing.
     *
     * ⚠️ What this still cannot see is the reserved HEIGHT: jsdom computes no layout,
     * so `min-height` is invisible to every test in this repo. That half is checked by
     * looking at the window on a phone.
     */
    it('has exactly one thing to say in every state the member can reach', async () => {
      const seen = []

      await type('ab') // too short
      seen.push(statusSays())

      await wrapper.find('[data-test="alias-first-input"]').setValue('Bernd') // asking
      seen.push(statusSays())

      await type('Bernd') // free
      seen.push(statusSays())

      takenNames.value = ['Peter']
      await type('Peter') // taken
      seen.push(statusSays())

      failingNames.value = ['Klaus']
      await type('Klaus') // could not be checked
      seen.push(statusSays())

      expect(seen).toEqual([
        ['alias-first-invalid'],
        ['alias-first-checking'],
        ['alias-first-free'],
        ['alias-first-taken'],
        ['alias-first-check-failed'],
      ])
    })

    // One query per pause, not per keystroke. Five characters used to mean five round
    // trips, and every answer arriving flipped the line and moved the layout again.
    //
    // Measured on what actually went out. The version of this test that read the
    // component's own `probed` ref proved only that a ref had been set - the query was
    // never part of it, because the mock did not look at the variables.
    it('asks the server once for a word, not once per letter', async () => {
      const input = wrapper.find('[data-test="alias-first-input"]')
      for (const value of ['B', 'Be', 'Ber', 'Bern', 'Bernd']) {
        await input.setValue(value)
        vi.advanceTimersByTime(50)
      }

      expect(asked.value).toEqual([])

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(asked.value).toEqual(['Bernd'])
    })

    it('goes back to the proposal', async () => {
      await wrapper.find('[data-test="alias-first-back"]').trigger('click')

      expect(wrapper.find('[data-test="alias-proposal"]').exists()).toBe(true)
    })

    /**
     * ⛔ This window is never unmounted -- DashboardLayout renders it for the whole
     * session -- so the `onBeforeUnmount` that was supposed to hold the debounce fires
     * on nothing. Leaving mid-word still sent the question 300 ms later, and because
     * `typed` kept its value the query stayed enabled for the rest of the session.
     */
    it('stops asking about a half-typed word when the member goes back', async () => {
      await wrapper.find('[data-test="alias-first-input"]').setValue('Bern')
      await wrapper.find('[data-test="alias-first-back"]').trigger('click')

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(asked.value).toEqual([])
    })

    it('stops asking about a half-typed word when the window is closed', async () => {
      await wrapper.find('[data-test="alias-first-input"]').setValue('Bern')
      await wrapper.findComponent({ name: 'BModal' }).vm.$emit('update:modelValue', false)

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(asked.value).toEqual([])
    })
  })
})
