// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import EmailChange from './EmailChange.vue'
import { confirmEmailChange, revokeEmailChange } from '@/graphql/mutations'

vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot></slot></button>',
  },
}))

vi.mock('@/components/Message/Message.vue', () => ({
  default: {
    name: 'Message',
    props: ['headline', 'subtitle', 'buttonText', 'linkTo'],
    template: '<div data-test="message">{{ headline }} | {{ subtitle }}</div>',
  },
}))

const route = { name: 'EmailChangeConfirm', params: { changeCode: 'the-code' } }
vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

const confirmMock = vi.fn()
const revokeMock = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn((document) => ({
    mutate: document === confirmEmailChange ? confirmMock : revokeMock,
  })),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      login: 'Login',
      'message.title': 'Done',
      'message.errorTitle': 'Error',
      'emailChange.confirm.title': 'Confirm new e-mail address',
      'emailChange.confirm.text': 'confirm text',
      'emailChange.confirm.button': 'Confirm new address',
      'emailChange.confirm.done': 'confirmed',
      'emailChange.revoke.title': 'Discard change',
      'emailChange.revoke.text': 'revoke text',
      'emailChange.revoke.button': 'Discard change',
      'emailChange.revoke.done': 'discarded',
      'emailChange.invalid': 'link invalid',
    },
  },
})

const emailCommit = vi.fn()
const makeStore = (token) =>
  createStore({
    state: () => ({ token, email: 'old@example.org' }),
    mutations: { email: emailCommit },
  })

const mountPage = (token = '') =>
  mount(EmailChange, { global: { plugins: [makeStore(token), i18n] } })

describe('EmailChange page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.name = 'EmailChangeConfirm'
    route.params = { changeCode: 'the-code' }
  })

  describe('confirming', () => {
    it('does nothing on being opened - a mail scanner that prefetches the link must not confirm', () => {
      const wrapper = mountPage()
      expect(wrapper.text()).toContain('Confirm new e-mail address')
      expect(wrapper.find('[data-test="email-change-action"]').exists()).toBe(true)
      expect(confirmMock).not.toHaveBeenCalled()
      expect(revokeMock).not.toHaveBeenCalled()
    })

    it('confirms with the code on click and reports success', async () => {
      confirmMock.mockResolvedValue({ data: { confirmEmailChange: 'new@example.org' } })
      const wrapper = mountPage()
      await wrapper.find('[data-test="email-change-action"]').trigger('click')
      await nextTick()
      await nextTick()
      expect(confirmMock).toHaveBeenCalledWith({ code: 'the-code' })
      expect(wrapper.find('[data-test="message"]').text()).toBe('Done | confirmed')
      expect(emailCommit).not.toHaveBeenCalled()
    })

    // The code is public, and the wallet signed in on this device need not be the account
    // the code belongs to - so the open session is left alone.
    it('leaves a signed-in wallet untouched', async () => {
      confirmMock.mockResolvedValue({ data: { confirmEmailChange: 'new@example.org' } })
      const wrapper = mountPage('some-token')
      await wrapper.find('[data-test="email-change-action"]').trigger('click')
      await nextTick()
      await nextTick()
      expect(wrapper.find('[data-test="message"]').text()).toBe('Done | confirmed')
      expect(emailCommit).not.toHaveBeenCalled()
    })

    /**
     * ⛔ The button under the success message used to be built with
     * `routeWithParamsAndQuery('Login')`, which carries the CURRENT route's params over -
     * and this route's param landed in `/login/:code?`, where `code` means the redeem code
     * of a transaction link. The member got `/login/<confirmation code>`, and after a
     * successful login `Login.vue` sent them on to `/redeem/<confirmation code>`: a dead
     * end at the very end of the change. Found by hand, 24.08.2026.
     *
     * Two things keep it away now: the link takes no params, and this route's param is
     * named `changeCode`, so nothing of ours fits that slot any more.
     */
    it('sends to the plain login page - never with the confirmation code in it', async () => {
      confirmMock.mockResolvedValue({ data: { confirmEmailChange: 'new@example.org' } })
      const wrapper = mountPage()
      await wrapper.find('[data-test="email-change-action"]').trigger('click')
      await nextTick()
      await nextTick()
      expect(wrapper.findComponent({ name: 'Message' }).props('linkTo')).toEqual({ name: 'Login' })
    })

    it('tells about an invalid or expired link in the member language', async () => {
      confirmMock.mockRejectedValue(new Error('GraphQL error: Invalid or expired code'))
      const wrapper = mountPage()
      await wrapper.find('[data-test="email-change-action"]').trigger('click')
      await nextTick()
      await nextTick()
      expect(wrapper.find('[data-test="message"]').text()).toBe('Error | link invalid')
    })
  })

  describe('revoking', () => {
    beforeEach(() => {
      route.name = 'EmailChangeRevoke'
      route.params = { changeCode: 'the-veto' }
    })

    it('revokes with the veto code on click - never the confirmation', async () => {
      revokeMock.mockResolvedValue({ data: { revokeEmailChange: true } })
      const wrapper = mountPage()
      expect(wrapper.text()).toContain('Discard change')
      await wrapper.find('[data-test="email-change-action"]').trigger('click')
      await nextTick()
      await nextTick()
      expect(revokeMock).toHaveBeenCalledWith({ vetoCode: 'the-veto' })
      expect(confirmMock).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="message"]').text()).toBe('Done | discarded')
    })
  })
})
