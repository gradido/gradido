import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
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
  BModal: {
    props: ['modelValue'],
    template: '<div v-if="modelValue"><slot></slot><slot name="footer"></slot></div>',
  },
}))

const statusMock = ref({ aliasStatus: { aliasSettled: false } })
const checkMock = ref({ checkUsername: true })
const checkLoadingMock = ref(false)
const refetchMock = vi.fn()
const adoptMock = vi.fn()
const updateMock = vi.fn()

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((query) => ({
    result: query === 'ALIAS_STATUS' ? statusMock : checkMock,
    loading: query === 'ALIAS_STATUS' ? ref(false) : checkLoadingMock,
    refetch: refetchMock,
  })),
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

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    statusMock.value = { aliasStatus: { aliasSettled: false } }
    checkMock.value = { checkUsername: true }
    checkLoadingMock.value = false
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
      checkMock.value = { checkUsername: false }
      await type('taken')

      expect(wrapper.find('[data-test="alias-first-taken"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="alias-first-save"]').attributes('disabled')).toBeDefined()
    })

    // A name that is too short is not a name somebody else holds. Saying "taken" sends
    // the member looking for another word when the word was fine, and it is the very
    // first thing the wallet ever tells them. The mock answers "free" on purpose: that
    // is the honest case, because the server's answer to the PREVIOUS keystroke is what
    // `available` still holds while the new query is on its way.
    it('says a short name has the wrong shape, not that it is taken', async () => {
      await type('ab')

      expect(wrapper.find('[data-test="alias-first-invalid"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="alias-first-taken"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="alias-first-save"]').attributes('disabled')).toBeDefined()
    })

    // The answer in hand belongs to the word typed before this one. Leaving it on
    // screen while the next answer is on its way is how a name that turns out to be
    // taken keeps a green Save button for the length of a round trip - and the member
    // gets a bare error code for clicking what the window told them to click.
    it('trusts no answer while the next one is on its way', async () => {
      await type('Bernd')
      expect(wrapper.find('[data-test="alias-first-save"]').attributes('disabled')).toBeUndefined()

      checkLoadingMock.value = true
      await type('Peter')

      expect(wrapper.find('[data-test="alias-first-free"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="alias-first-save"]').attributes('disabled')).toBeDefined()
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
     * Which change should make this red: putting the messages back into a chain that can
     * render nothing, or dropping the reserved row.
     */
    it('keeps the status line in place while the answer is on its way', async () => {
      const status = () => wrapper.find('.alias-first-status')

      await wrapper.find('[data-test="alias-first-input"]').setValue('Bern')
      // Mid-keystroke: the debounce has not fired, so nothing is known about this word.
      expect(status().exists()).toBe(true)
      expect(wrapper.find('[data-test="alias-first-checking"]').exists()).toBe(true)

      await type('Bernd')
      expect(status().exists()).toBe(true)
      expect(wrapper.find('[data-test="alias-first-free"]').exists()).toBe(true)

      checkLoadingMock.value = true
      await type('Bernda')
      expect(status().exists()).toBe(true)
    })

    // One query per pause, not per keystroke. Five characters used to mean five round
    // trips, and every answer arriving flipped the line and moved the layout again.
    //
    // The assertion that carries this is the one MID-burst: while the member is still
    // typing, no intermediate word may have gone out. Checking only the end state would
    // pass without any debounce at all.
    it('asks the server once for a word, not once per letter', async () => {
      const input = wrapper.find('[data-test="alias-first-input"]')
      for (const value of ['B', 'Be', 'Ber', 'Bern', 'Bernd']) {
        await input.setValue(value)
        vi.advanceTimersByTime(50)
      }

      expect(wrapper.vm.probed).toBe('BerndH')

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(wrapper.vm.probed).toBe('Bernd')
    })

    it('goes back to the proposal', async () => {
      await wrapper.find('[data-test="alias-first-back"]').trigger('click')

      expect(wrapper.find('[data-test="alias-proposal"]').exists()).toBe(true)
    })
  })
})
