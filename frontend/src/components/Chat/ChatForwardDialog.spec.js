// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import ChatForwardDialog from './ChatForwardDialog.vue'
import { forwardChatMessage } from '@/graphql/chat.graphql'

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      values === undefined
        ? key
        : `${key} ${typeof values === 'number' ? values : JSON.stringify(values)}`,
    d: (date, format) => `${format}(${date.toISOString()})`,
    locale: ref('de'),
  }),
}))

/** What the server answers to forwardChatMessage: a test sets it. */
const forwarded = vi.hoisted(() => vi.fn())
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: {} }),
  useMutation: (document) => ({ mutate: (variables) => forwarded(document, variables) }),
}))
/**
 * The contacts and groups to choose from, as useChatForwardTargets hands them out (its own spec is
 * about where they come from): a test sets the lists and the three states.
 */
const targets = vi.hoisted(() => ({ made: null }))
vi.mock('@/composables/useChatForwardTargets', () => ({
  useChatForwardTargets: () => targets.made,
}))
/** The chat's beat, asked at once after a message went. */
const polled = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useChatUpdates', () => ({ pollChatNow: polled }))
const toasts = vi.hoisted(() => ({ success: [], error: [] }))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: (message) => toasts.success.push(message),
    toastError: (message) => toasts.error.push(message),
  }),
}))

const contact = (gradidoID, alias, extra = {}) => ({
  user: { communityUuid: 'home-uuid', communityName: 'KI Playground', gradidoID, alias },
  homeCommunity: true,
  ...extra,
})
const CARLA = contact('carla-id', 'Carla-Sonne')
const OMA = contact('oma-id', 'Oma-Emma')
const LENA = {
  user: {
    communityUuid: 'wien-uuid',
    communityName: 'Gradido Wien',
    gradidoID: 'lena-id',
    alias: 'Lena-Mond',
  },
  homeCommunity: false,
}
const group = (n, title) => ({
  groupUuid: `group-${n}`,
  title,
  memberCount: 6,
  lastMessageAt: null,
})
const GROUPS = [group(1, 'Gradido-Café Berlin'), group(2, 'Gemeinschaftsgarten Pankow')]
const MESSAGE = {
  id: 6,
  messageUuid: 'uuid-6',
  mine: false,
  subject: null,
  body: 'Der Hofflohmarkt ist am Sonntag ab 11 Uhr.',
  createdAt: '2026-09-30T14:28:00.000Z',
}

describe('ChatForwardDialog (E-059)', () => {
  let wrapper

  const mountDialog = (props = {}, lists = {}) => {
    targets.made = {
      contacts: ref(lists.contacts ?? [CARLA, OMA, LENA]),
      groups: ref(lists.groups ?? GROUPS),
      loading: ref(lists.loading ?? false),
      contactsFailed: ref(lists.contactsFailed ?? false),
      groupsFailed: ref(lists.groupsFailed ?? false),
      load: vi.fn(),
    }
    wrapper = mount(ChatForwardDialog, {
      props: {
        modelValue: false,
        message: MESSAGE,
        writer: 'Anna-Sonne',
        'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
        ...props,
      },
      global: {
        stubs: {
          BSpinner: { template: '<i data-test="wheel" />' },
          BModal: {
            name: 'BModal',
            props: { modelValue: Boolean, fullscreen: [String, Boolean], scrollable: Boolean },
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
          BButton: { template: '<button type="button" v-bind="$attrs"><slot /></button>' },
          IMdiShare: true,
        },
      },
    })
    return wrapper
  }

  const find = (test) => wrapper.find(`[data-test="${test}"]`)
  const open = () => wrapper.setProps({ modelValue: true })
  const choose = async (...ids) => {
    for (const id of ids) {
      const test = id.startsWith('group-') ? `chat-group-pick-group-${id}` : `chat-group-pick-${id}`
      await find(test).find('input').setValue(true)
    }
  }
  const go = async () => {
    await find('chat-forward-go').trigger('click')
    await flushPromises()
  }

  afterEach(() => {
    wrapper?.unmount()
    forwarded.mockReset()
    polled.mockReset()
    toasts.success.length = 0
    toasts.error.length = 0
  })

  it('is a sheet on a phone whose list scrolls on a desk, named "Weiterleiten"', async () => {
    mountDialog()
    await open()
    const modal = wrapper.findComponent({ name: 'BModal' })
    expect(modal.props()).toMatchObject({ fullscreen: 'sm', scrollable: true })
    expect(modal.attributes('aria-label')).toBe('chatForward.title')
    expect(find('chat-forward-title').text()).toBe('chatForward.title')
  })

  it('shows the message it is about, with who wrote it and when', async () => {
    mountDialog()
    await open()
    expect(find('chat-forward-preview-who').text()).toBe(
      'Anna-Sonne, time(2026-09-30T14:28:00.000Z)',
    )
    expect(find('chat-forward-preview-text').text()).toBe(MESSAGE.body)
    await wrapper.setProps({ message: { ...MESSAGE, mine: true, body: '', subject: null } })
    expect(find('chat-forward-preview-who').text()).toBe(
      'chatThread.you, time(2026-09-30T14:28:00.000Z)',
    )
    expect(find('chat-forward-preview-text').text()).toBe('chatForward.picture')
  })

  it("offers the member's groups and contacts, another community's greyed, five at most", async () => {
    mountDialog()
    await open()
    const picker = wrapper.findComponent({ name: 'ChatGroupPicker' })
    expect(picker.props()).toMatchObject({ max: 5, groups: GROUPS, label: 'chatForward.to' })
    expect(find('chat-group-pick-lena-id').classes()).toContain('is-off')
  })

  it('waits for somebody to forward to', async () => {
    mountDialog()
    await open()
    expect(find('chat-forward-go').attributes('aria-disabled')).toBe('true')
    expect(find('chat-forward-go').text()).toBe('chatForward.go')
    await go()
    expect(forwarded).not.toHaveBeenCalled()

    await choose('group-1', 'carla-id')
    expect(find('chat-forward-go').attributes('aria-disabled')).toBe('false')
    expect(find('chat-forward-go').text()).toBe('chatForward.goTo {"count":2}')
  })

  it('offers the box only with a contact chosen, and names them', async () => {
    mountDialog()
    await open()
    await choose('group-1')
    expect(find('chat-forward-email').exists()).toBe(false)
    await choose('carla-id')
    expect(wrapper.text()).toContain('chatForward.byEmailOne {"name":"Carla-Sonne"}')
    await choose('oma-id')
    expect(wrapper.text()).toContain('chatForward.byEmailMany {"count":2}')
  })

  it('forwards the message into the groups and to the contacts chosen, with the words and the box', async () => {
    forwarded.mockResolvedValue({ data: { forwardChatMessage: [{ id: 1 }, { id: 2 }, { id: 3 }] } })
    mountDialog()
    await open()
    await choose('group-2', 'carla-id', 'oma-id')
    await find('chat-forward-words').setValue('Wer kommt mit?')
    await find('chat-forward-email').setValue(true)

    await go()

    expect(forwarded).toHaveBeenCalledWith(forwardChatMessage, {
      messageUuid: 'uuid-6',
      groupUuids: ['group-2'],
      members: [
        { gradidoID: 'carla-id', communityUuid: 'home-uuid' },
        { gradidoID: 'oma-id', communityUuid: 'home-uuid' },
      ],
      words: 'Wer kommt mit?',
      alsoByEmail: true,
    })
    expect(toasts.success).toEqual([
      'chatForward.done {"names":"Gemeinschaftsgarten Pankow, Carla-Sonne und Oma-Emma"}',
    ])
    // The beat asks at once: the copies show in an open thread, and every list asks again.
    expect(polled).toHaveBeenCalledTimes(1)
    expect(wrapper.props('modelValue')).toBe(false)
  })

  it('sends no words that are only spaces, and no box without a contact', async () => {
    forwarded.mockResolvedValue({ data: { forwardChatMessage: [{ id: 1 }] } })
    mountDialog()
    await open()
    await choose('group-1')
    await find('chat-forward-words').setValue('   ')
    await go()
    expect(forwarded.mock.calls[0][1]).toMatchObject({
      words: null,
      alsoByEmail: false,
      members: [],
    })
  })

  it('says so where some conversations did not get it, and does not ask again', async () => {
    forwarded.mockResolvedValue({ data: { forwardChatMessage: [{ id: 1 }] } })
    mountDialog()
    await open()
    await choose('group-1', 'carla-id')
    await go()
    expect(toasts.error).toEqual(['chatForward.partly {"done":1,"count":2}'])
    expect(polled).toHaveBeenCalledTimes(1)
    expect(wrapper.props('modelValue')).toBe(false)
  })

  it('stays open and says so where nothing went, or the server refused', async () => {
    forwarded.mockResolvedValue({ data: { forwardChatMessage: [] } })
    mountDialog()
    await open()
    await choose('carla-id')
    await go()
    expect(find('chat-forward-problem').text()).toBe('chatForward.failed')
    expect(wrapper.props('modelValue')).toBe(true)
    expect(polled).not.toHaveBeenCalled()

    forwarded.mockRejectedValue(new Error('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_MESSAGE'))
    await choose('oma-id')
    expect(find('chat-forward-problem').exists()).toBe(false)
    await go()
    expect(find('chat-forward-problem').text()).toBe('chatForward.failed')
  })

  it('forwards once while the copies are on their way', async () => {
    let answer
    forwarded.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    mountDialog()
    await open()
    await choose('carla-id')
    await find('chat-forward-go').trigger('click')
    await find('chat-forward-go').trigger('click')
    expect(forwarded).toHaveBeenCalledTimes(1)
    expect(find('chat-forward-go').attributes('aria-disabled')).toBe('true')
    answer({ data: { forwardChatMessage: [{ id: 1 }] } })
    await flushPromises()
  })

  it('starts every opening empty', async () => {
    mountDialog()
    await open()
    await choose('group-1', 'carla-id')
    await find('chat-forward-words').setValue('Hallo')
    await wrapper.setProps({ modelValue: false })
    await open()
    expect(find('chat-group-pick-group-group-1').find('input').element.checked).toBe(false)
    expect(find('chat-group-pick-carla-id').find('input').element.checked).toBe(false)
    expect(find('chat-forward-words').element.value).toBe('')
  })

  /**
   * The dialog stands in the conversation's window and finds its lists by itself (Bernd,
   * 01.10.2026: outside the contacts page "Weiterleiten" did nothing). Where no page handed them
   * down they are asked for when it opens, and are on their way for a moment.
   */
  describe('the contacts and groups it finds by itself', () => {
    it('asks for them at every opening', async () => {
      mountDialog()
      expect(targets.made.load).not.toHaveBeenCalled()
      await open()
      expect(targets.made.load).toHaveBeenCalledTimes(1)
      await wrapper.setProps({ modelValue: false })
      await open()
      expect(targets.made.load).toHaveBeenCalledTimes(2)
    })

    it('shows the wheel while they are on their way, then the lists', async () => {
      mountDialog({}, { contacts: [], groups: [], loading: true })
      await open()
      expect(find('chat-forward-loading').find('[data-test="wheel"]').exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'ChatGroupPicker' }).exists()).toBe(false)
      // The message it is about and the buttons are there meanwhile. The words' field comes with
      // the lists: a field one is typing in must not be pushed down when they land.
      expect(find('chat-forward-preview-text').text()).toBe(MESSAGE.body)
      expect(find('chat-forward-go').attributes('aria-disabled')).toBe('true')
      expect(find('chat-forward-words').exists()).toBe(false)

      targets.made.contacts.value = [CARLA]
      targets.made.groups.value = GROUPS
      targets.made.loading.value = false
      await wrapper.vm.$nextTick()

      expect(find('chat-forward-loading').exists()).toBe(false)
      expect(find('chat-group-pick-carla-id').exists()).toBe(true)
      expect(find('chat-group-pick-group-group-1').exists()).toBe(true)
      expect(find('chat-forward-words').exists()).toBe(true)
    })

    it('keeps the lists it has on screen while it asks again', async () => {
      mountDialog({}, { loading: true })
      await open()
      expect(find('chat-forward-loading').exists()).toBe(false)
      expect(find('chat-group-pick-carla-id').exists()).toBe(true)
    })

    // A failed request is not an empty list.
    it('says the contacts could not be loaded, not that there are none', async () => {
      mountDialog({}, { contacts: [], contactsFailed: true })
      await open()
      expect(find('chat-group-picker-none').text()).toBe('contacts.notReachable')
      expect(find('chat-group-pick-group-group-1').exists()).toBe(true)
      wrapper.unmount()

      mountDialog({}, { contacts: [] })
      await open()
      expect(find('chat-group-picker-none').text()).toBe('chatForward.noContacts')
    })

    it('says the groups could not be loaded, and offers the contacts', async () => {
      mountDialog({}, { groups: [], groupsFailed: true })
      await open()
      expect(find('chat-forward-groups-error').text()).toBe('chatGroup.notReachable')
      expect(find('chat-group-pick-carla-id').exists()).toBe(true)
      wrapper.unmount()

      mountDialog({}, { groups: [] })
      await open()
      expect(find('chat-forward-groups-error').exists()).toBe(false)
    })
  })
})
