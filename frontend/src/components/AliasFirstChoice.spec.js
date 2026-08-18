import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
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

const statusMock = ref({ aliasStatus: { aliasChosen: false } })
const checkMock = ref({ checkUsername: true })
const refetchMock = vi.fn()
const adoptMock = vi.fn()
const updateMock = vi.fn()

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((query) => ({
    result: query === 'ALIAS_STATUS' ? statusMock : checkMock,
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
      'settings.username.first-rules': '3 to 20 characters',
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

  beforeEach(() => {
    vi.clearAllMocks()
    statusMock.value = { aliasStatus: { aliasChosen: false } }
    checkMock.value = { checkUsername: true }
    wrapper = mountComponent()
  })

  // Only a member still holding a name the system built for them has anything to
  // answer here.
  it('stays away from somebody who already picked their name', () => {
    statusMock.value = { aliasStatus: { aliasChosen: true } }
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
      await wrapper.find('[data-test="alias-first-input"]').setValue('taken')

      expect(wrapper.find('[data-test="alias-first-taken"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="alias-first-save"]').attributes('disabled')).toBeDefined()
    })

    it('saves a free one and closes', async () => {
      await wrapper.find('[data-test="alias-first-input"]').setValue('Bernd')
      await wrapper.find('[data-test="alias-first-save"]').trigger('click')

      expect(updateMock).toHaveBeenCalledWith({ alias: 'Bernd' })
      expect(wrapper.find('[data-test="alias-first-choice"]').exists()).toBe(false)
    })

    it('goes back to the proposal', async () => {
      await wrapper.find('[data-test="alias-first-back"]').trigger('click')

      expect(wrapper.find('[data-test="alias-proposal"]').exists()).toBe(true)
    })
  })
})
