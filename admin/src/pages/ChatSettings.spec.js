// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ChatSettings from './ChatSettings.vue'
import {
  chatVideoServers,
  checkChatVideoServersNow,
  createChatVideoServer,
  deleteChatVideoServer,
  updateChatVideoServer,
} from '@/graphql/chatVideoServers.graphql'

// Stable spies: a test has to see WHICH message was raised.
const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastSuccess, toastError }) }))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    // Parameters stay visible, so a test can tell which value went into a sentence.
    t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
    locale: { value: 'de' },
  }),
}))

const { store } = vi.hoisted(() => ({ store: { state: { moderator: { role: 'ADMIN' } } } }))
vi.mock('vuex', () => ({ useStore: () => store }))

// The list as the server answers it: a real ref, handed over after the mount where a test needs
// to see "not answered yet" first.
const serversResult = ref(null)
const serversError = ref(null)
const refetch = vi.fn(() => Promise.resolve())
const queried = { options: null }

// One spy per mutation, told apart by the document the page asks for -- a spy per call would
// let a test believe the page sent a change through the wrong mutation.
const sent = {
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  check: vi.fn(),
}
const mutationFor = (document) => {
  if (document === createChatVideoServer) return sent.create
  if (document === updateChatVideoServer) return sent.update
  if (document === deleteChatVideoServer) return sent.remove
  if (document === checkChatVideoServersNow) return sent.check
  throw new Error('the page asked for a mutation this spec does not know')
}
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((document, _variables, options) => {
    if (document !== chatVideoServers) {
      throw new Error('the page asked for a query this spec does not know')
    }
    queried.options = options
    return { result: serversResult, error: serversError, refetch }
  }),
  useMutation: vi.fn((document) => ({ mutate: mutationFor(document) })),
}))

// The dialog as a stand-in: its props are bootstrap-vue-next's (okTitle, cancelTitle, okVariant,
// okDisabled -- measured in the installed 0.26.8), its buttons send what the real ones send, the
// OK button with an event, because the page listens with `@ok.prevent`.
const ModalStandIn = {
  name: 'BModal',
  props: ['modelValue', 'title', 'okTitle', 'cancelTitle', 'okVariant', 'okDisabled'],
  emits: ['ok', 'update:modelValue'],
  template: `
    <div v-if="modelValue" class="modal-stand-in">
      <div class="modal-stand-in-title">{{ title }}</div>
      <slot />
      <button class="modal-stand-in-cancel" @click="$emit('update:modelValue', false)">{{ cancelTitle }}</button>
      <button class="modal-stand-in-ok" :disabled="okDisabled" @click="$emit('ok', { preventDefault() {} })">{{ okTitle }}</button>
    </div>`,
}

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString()

const FAIRMEETING = {
  id: 1,
  baseUrl: 'https://fairmeeting.net/',
  host: 'fairmeeting.net',
  operator: 'fairmeeting (fairkom)',
  roomPrefix: 'GradidoAkademie',
  note: 'Akademie-Lizenz',
  active: true,
  createdAt: minutesAgo(600),
  updatedAt: null,
  check: { ok: true, reason: null, checkedAt: minutesAgo(3), latencyMs: 180, picks: 4 },
}
const FFMUC = {
  id: 2,
  baseUrl: 'https://meet.ffmuc.net/',
  host: 'meet.ffmuc.net',
  operator: null,
  roomPrefix: null,
  note: null,
  active: false,
  createdAt: minutesAgo(600),
  updatedAt: null,
  check: { ok: false, reason: 'UNREACHABLE', checkedAt: minutesAgo(3), latencyMs: null, picks: 0 },
}
const SYSTEMLI = {
  id: 3,
  baseUrl: 'https://meet.systemli.org/',
  host: 'meet.systemli.org',
  operator: 'Systemli',
  roomPrefix: null,
  note: null,
  active: true,
  createdAt: minutesAgo(1),
  updatedAt: null,
  check: null,
}

const mountPage = () =>
  mount(ChatSettings, {
    global: {
      stubs: { BModal: ModalStandIn },
      mocks: { $t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key) },
    },
  })

const checkboxIn = (wrapper, selector) => wrapper.find(`${selector} input[type="checkbox"]`)

describe('ChatSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.state.moderator.role = 'ADMIN'
    serversResult.value = { chatVideoServers: [FAIRMEETING, FFMUC, SYSTEMLI] }
    serversError.value = null
    sent.create.mockResolvedValue({ data: { createChatVideoServer: SYSTEMLI } })
    sent.update.mockResolvedValue({ data: { updateChatVideoServer: FAIRMEETING } })
    sent.remove.mockResolvedValue({ data: { deleteChatVideoServer: true } })
    sent.check.mockResolvedValue({ data: { checkChatVideoServersNow: [FAIRMEETING, FFMUC] } })
  })

  describe('for somebody who is not an administrator', () => {
    beforeEach(() => {
      store.state.moderator.role = 'MODERATOR'
    })

    it('shows only the sentence, and asks the server for nothing', () => {
      const wrapper = mountPage()
      expect(wrapper.text()).toContain('chatAdmin.adminOnly')
      expect(wrapper.find('.chat-server-list').exists()).toBe(false)
      expect(wrapper.find('[data-test="check-now"]').exists()).toBe(false)
      expect(queried.options.enabled.value).toBe(false)
    })
  })

  it('names the page and the section, and says how the servers are chosen and whose they are', () => {
    const wrapper = mountPage()
    expect(wrapper.find('.h2').text()).toBe('chatAdmin.title')
    expect(wrapper.find('.h4').text()).toBe('chatAdmin.servers.title')
    expect(wrapper.text()).toContain('chatAdmin.servers.hint')
    expect(wrapper.text()).toContain('chatAdmin.servers.fairness')
  })

  it('shows what the server holds, and keeps no timer of its own', () => {
    mountPage()
    expect(queried.options.fetchPolicy).toBe('network-only')
    expect(queried.options.enabled.value).toBe(true)
    expect(queried.options.pollInterval).toBeUndefined()
  })

  it('lists every server with its address, operator, prefix and note', () => {
    const wrapper = mountPage()
    const rows = wrapper.findAll('.chat-server-row')
    expect(rows).toHaveLength(3)
    expect(rows[0].find('.chat-server-address').text()).toBe('https://fairmeeting.net/')
    const details = wrapper.find('[data-test="details-1"]').text()
    expect(details).toContain('fairmeeting (fairkom)')
    expect(details).toContain('chatAdmin.servers.prefix:{"prefix":"GradidoAkademie"}')
    expect(details).toContain('Akademie-Lizenz')
    expect(wrapper.find('[data-test="details-2"]').text()).toBe('chatAdmin.servers.noOperator')
  })

  it('shows each tick as the server holds it', () => {
    const wrapper = mountPage()
    expect(checkboxIn(wrapper, '[data-test="server-1"]').element.checked).toBe(true)
    expect(checkboxIn(wrapper, '[data-test="server-2"]').element.checked).toBe(false)
  })

  describe('what the last check found', () => {
    it('says a server answers, and how fast, in green', () => {
      const state = mountPage().find('[data-test="state-1"]')
      const word = state.find('.chat-server-state-word')
      expect(word.text()).toBe('chatAdmin.state.ok:{"ms":180}')
      expect(word.classes()).toContain('text-success')
      expect(state.text()).toContain('chatAdmin.state.checkedAt:{"when":"vor 3 Minuten"}')
      expect(state.text()).toContain('chatAdmin.servers.picks:{"count":4}')
    })

    it('says a server does not answer, and why in words, in red', () => {
      const word = mountPage().find('[data-test="state-2"] .chat-server-state-word')
      expect(word.text()).toBe('chatAdmin.state.failed:{"reason":"chatAdmin.reason.UNREACHABLE"}')
      expect(word.classes()).toContain('text-danger')
    })

    it('puts every reason of the check in words', () => {
      for (const reason of [
        'UNREACHABLE',
        'NOT_JITSI',
        'LOGIN_REQUIRED',
        'NO_ANONYMOUS',
        'NO_BOSH',
      ]) {
        serversResult.value = {
          chatVideoServers: [{ ...FFMUC, check: { ...FFMUC.check, reason } }],
        }
        const word = mountPage().find('[data-test="state-2"] .chat-server-state-word')
        expect(word.text()).toBe(`chatAdmin.state.failed:{"reason":"chatAdmin.reason.${reason}"}`)
      }
    })

    it('says a server was not checked yet, in grey, and no time and no count', () => {
      const state = mountPage().find('[data-test="state-3"]')
      expect(state.find('.chat-server-state-word').text()).toBe('chatAdmin.state.unchecked')
      expect(state.find('.chat-server-state-word').classes()).toContain('text-secondary')
      expect(state.text()).not.toContain('chatAdmin.state.checkedAt')
      expect(state.text()).not.toContain('chatAdmin.servers.picks')
    })
  })

  it('says nothing about an empty list before the server answered, and then that it is empty', async () => {
    serversResult.value = null
    const wrapper = mountPage()
    expect(wrapper.find('[data-test="servers-empty"]').exists()).toBe(false)

    serversResult.value = { chatVideoServers: [] }
    await flushPromises()
    expect(wrapper.find('[data-test="servers-empty"]').text()).toBe('chatAdmin.servers.empty')
  })

  describe('adding a server', () => {
    it('can only be sent with an address', async () => {
      const wrapper = mountPage()
      expect(wrapper.find('[data-test="form-add"]').attributes('disabled')).toBeDefined()
      await wrapper.find('[data-test="form-base-url"]').setValue('https://meet.systemli.org')
      expect(wrapper.find('[data-test="form-add"]').attributes('disabled')).toBeUndefined()
    })

    it('sends what was typed, trimmed, empty fields as none, ticked unless untouched otherwise', async () => {
      const wrapper = mountPage()
      await wrapper.find('[data-test="form-base-url"]').setValue(' https://meet.systemli.org ')
      await wrapper.find('[data-test="form-operator"]').setValue(' Systemli ')
      await wrapper.find('[data-test="form-prefix"]').setValue('  ')
      await wrapper.find('[data-test="form-add"]').trigger('click')
      await flushPromises()

      expect(sent.create).toHaveBeenCalledWith({
        input: {
          baseUrl: 'https://meet.systemli.org',
          operator: 'Systemli',
          roomPrefix: null,
          note: null,
          active: true,
        },
      })
      expect(toastSuccess).toHaveBeenCalledWith('chatAdmin.created')
      expect(refetch).toHaveBeenCalled()
      // Empty again, for the next one.
      expect(wrapper.find('[data-test="form-base-url"]').element.value).toBe('')
    })

    it('sends the tick as it was set', async () => {
      const wrapper = mountPage()
      await wrapper.find('[data-test="form-base-url"]').setValue('https://fairmeeting.net/')
      await checkboxIn(wrapper, '.chat-server-form').setValue(false)
      await wrapper.find('[data-test="form-add"]').trigger('click')
      await flushPromises()
      expect(sent.create.mock.calls[0][0].input.active).toBe(false)
    })

    it.each([
      ['CHAT_VIDEO_SERVER_INVALID: NOT_HTTPS', 'chatAdmin.errors.invalid.NOT_HTTPS'],
      [
        'CHAT_VIDEO_SERVER_INVALID: NOT_A_BASE_ADDRESS',
        'chatAdmin.errors.invalid.NOT_A_BASE_ADDRESS',
      ],
      ['CHAT_VIDEO_SERVER_INVALID: BAD_PREFIX', 'chatAdmin.errors.invalid.BAD_PREFIX'],
      ['CHAT_VIDEO_SERVER_INVALID: TOO_LONG', 'chatAdmin.errors.invalid.TOO_LONG'],
      [
        'CHAT_VIDEO_SERVER_INVALID: SOMETHING_NEW',
        'chatAdmin.errors.invalid.other:{"reason":"SOMETHING_NEW"}',
      ],
      ['CHAT_VIDEO_SERVER_DUPLICATE', 'chatAdmin.errors.duplicate'],
      ['CHAT_VIDEO_SERVER_NOT_FOUND', 'chatAdmin.errors.notFound'],
      // The code is found inside a longer message as well.
      ['GraphQL error: CHAT_VIDEO_SERVER_DUPLICATE', 'chatAdmin.errors.duplicate'],
      // A message without a code is shown as it came.
      ['Failed to fetch', 'Failed to fetch'],
    ])('puts the refusal %s in words', async (message, words) => {
      sent.create.mockRejectedValueOnce(new Error(message))
      const wrapper = mountPage()
      await wrapper.find('[data-test="form-base-url"]').setValue('http://fairmeeting.net/')
      await wrapper.find('[data-test="form-add"]').trigger('click')
      await flushPromises()

      expect(toastError).toHaveBeenCalledWith(words)
      expect(toastSuccess).not.toHaveBeenCalled()
      // What was typed stays, to be corrected.
      expect(wrapper.find('[data-test="form-base-url"]').element.value).toBe(
        'http://fairmeeting.net/',
      )
    })
  })

  describe('the tick "in the random choice"', () => {
    it('switches at once, sending the server as it is with the new tick', async () => {
      const wrapper = mountPage()
      await checkboxIn(wrapper, '[data-test="server-2"]').setValue(true)
      await flushPromises()

      expect(sent.update).toHaveBeenCalledWith({
        id: 2,
        input: {
          baseUrl: 'https://meet.ffmuc.net/',
          operator: null,
          roomPrefix: null,
          note: null,
          active: true,
        },
      })
      expect(toastSuccess).toHaveBeenCalledWith(
        'chatAdmin.servers.activeOn:{"host":"meet.ffmuc.net"}',
      )
      expect(refetch).toHaveBeenCalled()
    })

    it('says so when a tick is taken away', async () => {
      const wrapper = mountPage()
      await checkboxIn(wrapper, '[data-test="server-1"]').setValue(false)
      await flushPromises()
      expect(sent.update.mock.calls[0][0].input.active).toBe(false)
      expect(toastSuccess).toHaveBeenCalledWith(
        'chatAdmin.servers.activeOff:{"host":"fairmeeting.net"}',
      )
    })

    // ⛔ The box itself toggled when it was clicked; only the page can take that back.
    it('shows the tick the server holds again where it refuses the change', async () => {
      sent.update.mockRejectedValueOnce(new Error('CHAT_VIDEO_SERVER_NOT_FOUND'))
      const wrapper = mountPage()
      const box = checkboxIn(wrapper, '[data-test="server-2"]')
      await box.setValue(true)
      await flushPromises()

      expect(toastError).toHaveBeenCalledWith('chatAdmin.errors.notFound')
      expect(refetch).toHaveBeenCalled()
      expect(checkboxIn(wrapper, '[data-test="server-2"]').element.checked).toBe(false)
    })
  })

  describe('editing a server in its row', () => {
    it('opens the row with its values, and sends the change with the tick it has', async () => {
      const wrapper = mountPage()
      await wrapper.find('[data-test="edit-1"]').trigger('click')
      expect(wrapper.find('[data-test="edit-base-url"]').element.value).toBe(
        'https://fairmeeting.net/',
      )
      expect(wrapper.find('[data-test="edit-prefix"]').element.value).toBe('GradidoAkademie')
      await wrapper.find('[data-test="edit-note"]').setValue('Lizenz bis 2027')
      await wrapper.find('[data-test="edit-save"]').trigger('click')
      await flushPromises()

      expect(sent.update).toHaveBeenCalledWith({
        id: 1,
        input: {
          baseUrl: 'https://fairmeeting.net/',
          operator: 'fairmeeting (fairkom)',
          roomPrefix: 'GradidoAkademie',
          note: 'Lizenz bis 2027',
          active: true,
        },
      })
      expect(toastSuccess).toHaveBeenCalledWith('chatAdmin.updated')
      expect(refetch).toHaveBeenCalled()
      expect(wrapper.find('[data-test="edit-base-url"]').exists()).toBe(false)
    })

    it('closes the row on cancel, and sends nothing', async () => {
      const wrapper = mountPage()
      await wrapper.find('[data-test="edit-2"]').trigger('click')
      await wrapper.find('[data-test="edit-cancel"]').trigger('click')
      expect(wrapper.find('[data-test="edit-base-url"]').exists()).toBe(false)
      expect(sent.update).not.toHaveBeenCalled()
    })

    it('keeps the row open with what was typed where the server refuses it', async () => {
      sent.update.mockRejectedValueOnce(new Error('CHAT_VIDEO_SERVER_DUPLICATE'))
      const wrapper = mountPage()
      await wrapper.find('[data-test="edit-1"]').trigger('click')
      await wrapper.find('[data-test="edit-base-url"]').setValue('https://meet.ffmuc.net/')
      await wrapper.find('[data-test="edit-save"]').trigger('click')
      await flushPromises()

      expect(toastError).toHaveBeenCalledWith('chatAdmin.errors.duplicate')
      expect(wrapper.find('[data-test="edit-base-url"]').element.value).toBe(
        'https://meet.ffmuc.net/',
      )
    })
  })

  describe('deleting a server', () => {
    it('asks first, naming the server, and deletes nothing on cancel', async () => {
      const wrapper = mountPage()
      await wrapper.find('[data-test="remove-1"]').trigger('click')
      const dialog = wrapper.find('.modal-stand-in')
      expect(dialog.text()).toContain('chatAdmin.removeDialog.question:{"host":"fairmeeting.net"}')
      expect(dialog.text()).toContain('chatAdmin.removeDialog.hint')
      expect(dialog.find('.modal-stand-in-cancel').text()).toBe('overlay.cancel')
      expect(wrapper.findComponent(ModalStandIn).props('okVariant')).toBe('danger')

      await dialog.find('.modal-stand-in-cancel').trigger('click')
      expect(wrapper.find('.modal-stand-in').exists()).toBe(false)
      expect(sent.remove).not.toHaveBeenCalled()
    })

    it('deletes after the yes', async () => {
      const wrapper = mountPage()
      await wrapper.find('[data-test="remove-1"]').trigger('click')
      await wrapper.find('.modal-stand-in-ok').trigger('click')
      await flushPromises()

      expect(sent.remove).toHaveBeenCalledWith({ id: 1 })
      expect(toastSuccess).toHaveBeenCalledWith('chatAdmin.removed')
      expect(refetch).toHaveBeenCalled()
      expect(wrapper.find('.modal-stand-in').exists()).toBe(false)
    })

    it('says so where the server was deleted on another tab', async () => {
      sent.remove.mockRejectedValueOnce(new Error('CHAT_VIDEO_SERVER_NOT_FOUND'))
      const wrapper = mountPage()
      await wrapper.find('[data-test="remove-2"]').trigger('click')
      await wrapper.find('.modal-stand-in-ok').trigger('click')
      await flushPromises()

      expect(toastError).toHaveBeenCalledWith('chatAdmin.errors.notFound')
      expect(refetch).toHaveBeenCalled()
      expect(wrapper.find('.modal-stand-in').exists()).toBe(false)
    })
  })

  describe('"check now"', () => {
    it('says it is checking, then how many answer, and shows the fresh state', async () => {
      let answer
      sent.check.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)))
      const wrapper = mountPage()
      await wrapper.find('[data-test="check-now"]').trigger('click')

      const button = wrapper.find('[data-test="check-now"]')
      expect(button.text()).toBe('chatAdmin.servers.checking')
      expect(button.attributes('disabled')).toBeDefined()
      expect(refetch).not.toHaveBeenCalled()

      answer({ data: { checkChatVideoServersNow: [FAIRMEETING, FFMUC] } })
      await flushPromises()
      expect(toastSuccess).toHaveBeenCalledWith('chatAdmin.servers.checked:{"ok":1,"count":2}')
      expect(refetch).toHaveBeenCalled()
      expect(wrapper.find('[data-test="check-now"]').text()).toBe('chatAdmin.servers.checkNow')
    })

    it('says what went wrong, and is ready again', async () => {
      sent.check.mockRejectedValueOnce(new Error('401 Unauthorized'))
      const wrapper = mountPage()
      await wrapper.find('[data-test="check-now"]').trigger('click')
      await flushPromises()
      expect(toastError).toHaveBeenCalledWith('401 Unauthorized')
      expect(wrapper.find('[data-test="check-now"]').attributes('disabled')).toBeUndefined()
    })
  })

  it('says so where the list cannot be read', async () => {
    mountPage()
    serversError.value = new Error('the list could not be read')
    await flushPromises()
    expect(toastError).toHaveBeenCalledWith('the list could not be read')
  })
})
