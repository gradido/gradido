// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import ProjectAccountConfirm from './ProjectAccountConfirm.vue'

vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot></slot></button>',
  },
  BFormInput: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />',
  },
  // Hands the event on: the component listens with `.prevent`, which needs something to
  // call preventDefault on.
  // `emits` declared, or the listener also falls through to the root form as a native one
  // and every submit reaches the handler twice.
  BForm: {
    emits: ['submit'],
    template: '<form @submit.prevent="$emit(`submit`, $event)"><slot></slot></form>',
  },
}))
// The word comes from the locale, so the test names it here rather than reading de.json:
// what is under test is the gate, not the translation.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => (key === 'settings.creationAccount.confirm.word' ? 'PROJEKTKONTO' : key),
  }),
}))

const build = (mode, busy = false) =>
  mount(ProjectAccountConfirm, { props: { mode, busy }, global: { mocks: { $t: (key) => key } } })

const declareButton = (wrapper) => wrapper.find('[data-test="project-account-confirm-declare"]')

describe('ProjectAccountConfirm', () => {
  describe('switching creation off', () => {
    it('starts with the question and the consequence, and confirms nothing on its own', () => {
      const wrapper = build('declare')
      expect(wrapper.find('[data-test="project-account-confirm-text"]').text()).toBe(
        'settings.creationAccount.confirm.declareText',
      )
      expect(wrapper.find('[data-test="project-account-confirm-word"]').exists()).toBe(false)
      expect(wrapper.emitted('confirm')).toBeFalsy()
    })

    it('asks for the word on the second step and keeps the button pale until it is typed', async () => {
      const wrapper = build('declare')
      await wrapper.find('[data-test="project-account-confirm-next"]').trigger('click')
      const input = wrapper.find('[data-test="project-account-confirm-word"]')
      expect(input.exists()).toBe(true)
      expect(declareButton(wrapper).attributes('disabled')).toBeDefined()

      await input.setValue('PROJEKT')
      expect(declareButton(wrapper).attributes('disabled')).toBeDefined()
      await wrapper.find('form').trigger('submit')
      expect(wrapper.emitted('confirm')).toBeFalsy()

      // Case and blanks do not count: the member has read the word, that is the point.
      await input.setValue('  projektkonto ')
      expect(declareButton(wrapper).attributes('disabled')).toBeUndefined()
      await wrapper.find('form').trigger('submit')
      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('confirms on Enter (a form submit) only with the word typed', async () => {
      const wrapper = build('declare')
      await wrapper.find('[data-test="project-account-confirm-next"]').trigger('click')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.emitted('confirm')).toBeFalsy()
      await wrapper.find('[data-test="project-account-confirm-word"]').setValue('PROJEKTKONTO')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('cancels from either step, and starts over at the question next time', async () => {
      const wrapper = build('declare')
      await wrapper.find('[data-test="project-account-confirm-next"]').trigger('click')
      await wrapper.find('[data-test="project-account-confirm-word"]').setValue('PROJEKTKONTO')
      await wrapper.find('[data-test="project-account-confirm-cancel"]').trigger('click')
      expect(wrapper.emitted('cancel')).toHaveLength(1)
      expect(wrapper.emitted('confirm')).toBeFalsy()
      await nextTick()
      expect(wrapper.find('[data-test="project-account-confirm-word"]').exists()).toBe(false)
      await wrapper.find('[data-test="project-account-confirm-next"]').trigger('click')
      expect(wrapper.find('[data-test="project-account-confirm-word"]').element.value).toBe('')
    })

    it('holds the button while a request is out', async () => {
      const wrapper = build('declare', true)
      await wrapper.find('[data-test="project-account-confirm-next"]').trigger('click')
      await wrapper.find('[data-test="project-account-confirm-word"]').setValue('PROJEKTKONTO')
      expect(declareButton(wrapper).attributes('disabled')).toBeDefined()
    })
  })

  describe('asking for creation back', () => {
    it('says that a person checks and a mail goes to the support, then confirms in one step', async () => {
      const wrapper = build('request')
      expect(wrapper.find('[data-test="project-account-confirm-text"]').text()).toBe(
        'settings.creationAccount.confirm.requestText',
      )
      expect(wrapper.find('[data-test="project-account-confirm-word"]').exists()).toBe(false)
      await wrapper.find('[data-test="project-account-confirm-request"]').trigger('click')
      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('can be cancelled', async () => {
      const wrapper = build('request')
      await wrapper.find('[data-test="project-account-confirm-cancel"]').trigger('click')
      expect(wrapper.emitted('cancel')).toHaveLength(1)
      expect(wrapper.emitted('confirm')).toBeFalsy()
    })
  })
})
