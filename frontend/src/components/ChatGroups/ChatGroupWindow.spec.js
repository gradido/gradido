// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import ChatGroupWindow from './ChatGroupWindow.vue'
import { setChatGroupMuted } from '@/graphql/chatGroups.graphql'

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      typeof values === 'number'
        ? `${key}:${values}`
        : values
          ? `${key} ${JSON.stringify(values)}`
          : key,
    d: (date, format) => `${format}(${date.toISOString()})`,
  }),
}))

const storeState = vi.hoisted(() => ({ gradidoID: 'me-id', communityUuid: 'home-uuid' }))
vi.mock('vuex', () => ({ useStore: () => ({ state: storeState }) }))

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess, toastError }),
}))

/** What the server answers to the bell: a test sets it; called with the document and variables. */
const saved = vi.hoisted(() => vi.fn())
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => ({ mutate: (variables) => saved(document, variables) }),
}))

const GROUP = {
  groupUuid: 'cafe-uuid',
  conversationId: 41,
  title: 'Gradido-Café Berlin',
  communityName: 'KI Playground',
  createdBy: { communityUuid: 'home-uuid', gradidoID: 'anna-id', alias: 'Anna-Sonne' },
  createdAt: '2026-09-27T10:00:00.000Z',
  role: 'OWNER',
  joinedAt: '2026-09-27T10:00:00.000Z',
  mutedByMe: false,
  memberCount: 5,
  unreadMessages: 0,
  lastMessageAt: null,
}

describe('ChatGroupWindow', () => {
  let wrapper

  const mountWindow = (group = {}) => {
    wrapper = mount(ChatGroupWindow, {
      props: { modelValue: true, group: { ...GROUP, ...group } },
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          BModal: {
            name: 'BModal',
            props: {
              modelValue: Boolean,
              fullscreen: [String, Boolean],
              lazy: Boolean,
              noHeader: Boolean,
              noFooter: Boolean,
            },
            template: '<div data-test="modal"><slot /></div>',
          },
          IBiX: true,
          IMdiBellOutline: { template: '<i data-test="bell-on" />' },
          IMdiBellOffOutline: { template: '<i data-test="bell-off" />' },
          // The thread has its own specs (ChatThread.group.spec.js); here: which group it gets.
          ChatThread: {
            props: ['group'],
            template: '<div data-test="thread" :data-group="group?.groupUuid" />',
          },
        },
      },
    })
    return wrapper
  }

  const find = (test) => wrapper.find(`[data-test="${test}"]`)
  const bell = () => find('chat-group-window-bell')

  afterEach(() => {
    wrapper?.unmount()
    saved.mockReset()
    toastSuccess.mockClear()
    toastError.mockClear()
  })

  describe('the head', () => {
    it("shows the group's square, name and community", () => {
      mountWindow()
      expect(find('chat-group-window-name').text()).toBe('Gradido-Café Berlin')
      expect(find('chat-group-window-community').text()).toBe('KI Playground')
      const square = wrapper.find('.app-avatar')
      expect(square.classes()).toContain('app-avatar-rounded')
      expect(square.text()).toBe('GB')
      expect(square.attributes('style')).toContain('width: 64px')
    })

    it("says how many are in it and the member's own part", () => {
      mountWindow()
      expect(find('chat-group-window-count').text()).toBe(
        'chatGroup.memberCount:5 · chatGroup.youAreOwner',
      )
    })

    it('says since when, and who opened it', () => {
      mountWindow()
      expect(find('chat-group-window-meta').text()).toBe(
        'chatGroup.since {"date":"monthAndYear(2026-09-27T10:00:00.000Z)"} · chatGroup.openedBy {"name":"Anna-Sonne"}',
      )
    })

    // By the Gradido ID, without regard to case, as the server compares it.
    it('says the member opened it where they did', () => {
      mountWindow({ createdBy: { communityUuid: 'home-uuid', gradidoID: 'ME-ID', alias: 'Bernd' } })
      expect(find('chat-group-window-meta').text()).toBe(
        'chatGroup.since {"date":"monthAndYear(2026-09-27T10:00:00.000Z)"} · chatGroup.openedByYou',
      )
    })

    it('says nothing about the opener where the server knows none', () => {
      mountWindow({ createdBy: null })
      expect(find('chat-group-window-meta').text()).toBe(
        'chatGroup.since {"date":"monthAndYear(2026-09-27T10:00:00.000Z)"}',
      )
    })
  })

  it('hands the thread its group', () => {
    mountWindow()
    expect(find('thread').attributes('data-group')).toBe('cafe-uuid')
  })

  it('is a sheet on a phone, with no header and no footer, named after the group', () => {
    mountWindow()
    const modal = wrapper.findComponent({ name: 'BModal' })
    expect(modal.props()).toMatchObject({ fullscreen: 'sm', noHeader: true, noFooter: true })
    expect(modal.attributes('aria-label')).toBe('Gradido-Café Berlin')
  })

  it('closes with its cross', async () => {
    mountWindow()
    await find('chat-group-window-close').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  describe('the bell', () => {
    it('shows the mark the list delivered', () => {
      mountWindow({ mutedByMe: true })
      expect(bell().attributes('aria-pressed')).toBe('true')
      expect(bell().attributes('aria-label')).toBe(
        'chatGroup.muteOff {"name":"Gradido-Café Berlin"}',
      )
      expect(bell().find('[data-test="bell-off"]').exists()).toBe(true)
    })

    it('mutes the group for the member, says so, and tells the page', async () => {
      saved.mockResolvedValue({ data: { setChatGroupMuted: true } })
      mountWindow()
      expect(bell().attributes('aria-label')).toBe('chatThread.muteOn')

      await bell().trigger('click')
      await flushPromises()

      expect(saved).toHaveBeenCalledWith(setChatGroupMuted, {
        groupUuid: 'cafe-uuid',
        muted: true,
      })
      expect(bell().attributes('aria-pressed')).toBe('true')
      expect(toastSuccess).toHaveBeenCalledWith(
        'chatGroup.mutedHint {"name":"Gradido-Café Berlin"}',
      )
      expect(wrapper.emitted('changed')).toHaveLength(1)
    })

    it('lifts it the same way', async () => {
      saved.mockResolvedValue({ data: { setChatGroupMuted: true } })
      mountWindow({ mutedByMe: true })
      await bell().trigger('click')
      await flushPromises()
      expect(saved).toHaveBeenCalledWith(setChatGroupMuted, {
        groupUuid: 'cafe-uuid',
        muted: false,
      })
      expect(toastSuccess).toHaveBeenCalledWith(
        'chatGroup.unmutedHint {"name":"Gradido-Café Berlin"}',
      )
    })

    it('goes back and says why where the server refuses', async () => {
      saved.mockRejectedValue(new Error('CHAT_GROUP_NOT_FOUND'))
      mountWindow()
      await bell().trigger('click')
      await flushPromises()
      expect(bell().attributes('aria-pressed')).toBe('false')
      expect(toastError).toHaveBeenCalledWith('CHAT_GROUP_NOT_FOUND')
      expect(wrapper.emitted('changed')).toBeUndefined()
    })

    // `false` is no change: back, and nothing said.
    it('goes back quietly where the server changed nothing', async () => {
      saved.mockResolvedValue({ data: { setChatGroupMuted: false } })
      mountWindow()
      await bell().trigger('click')
      await flushPromises()
      expect(bell().attributes('aria-pressed')).toBe('false')
      expect(toastSuccess).not.toHaveBeenCalled()
      expect(toastError).not.toHaveBeenCalled()
    })

    it('turns a second press away while the first is on its way', async () => {
      let answer
      saved.mockImplementation(
        () =>
          new Promise((resolve) => {
            answer = resolve
          }),
      )
      mountWindow()
      await bell().trigger('click')
      await bell().trigger('click')
      expect(saved).toHaveBeenCalledTimes(1)
      answer({ data: { setChatGroupMuted: true } })
      await flushPromises()
    })

    // The list asked again while the member's own switch is on its way must not put it back.
    it('keeps its own switch while a newer list comes in', async () => {
      let answer
      saved.mockImplementation(
        () =>
          new Promise((resolve) => {
            answer = resolve
          }),
      )
      mountWindow()
      await bell().trigger('click')
      await wrapper.setProps({ group: { ...GROUP, mutedByMe: false, memberCount: 6 } })
      expect(bell().attributes('aria-pressed')).toBe('true')
      answer({ data: { setChatGroupMuted: true } })
      await flushPromises()
      // And a list that comes after it counts again.
      await wrapper.setProps({ group: { ...GROUP, mutedByMe: false } })
      expect(bell().attributes('aria-pressed')).toBe('false')
    })
  })

  /**
   * ⛔ The two windows look alike because their rules are the same, not because somebody kept them
   * so: the group window writes the contact window's rules under its own names, and this holds
   * each against its twin -- the declarations, whatever their order.
   */
  describe('the measure of the contact window', () => {
    const rulesOf = (file) => {
      const code = readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8')
        .split('<style')[1]
        .replace(/\/\*[\s\S]*?\*\//g, '')
      const rules = new Map()
      for (const [, selectors, body] of code.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const declarations = body
          .split(';')
          .map((part) => part.trim().replace(/\s+/g, ' '))
          .filter(Boolean)
          .sort()
          .join('; ')
        for (const selector of selectors.split(',')) rules.set(selector.trim(), declarations)
      }
      return rules
    }
    const group = rulesOf('ChatGroupWindow.vue')
    const contact = rulesOf('../Contacts/ContactWindow.vue')

    const TWINS = [
      ['.chat-group-window-top', '.contact-window-top'],
      ['.chat-group-window-close', '.contact-window-close'],
      ['.chat-group-window-close:hover', '.contact-window-close:hover'],
      ['.chat-group-window-head', '.contact-window-head'],
      ['.chat-group-window-who', '.contact-window-who'],
      ['.chat-group-window-name', '.contact-window-name'],
      ['.chat-group-window-community', '.contact-window-community'],
      ['.chat-group-window-meta', '.contact-window-meta'],
      ['.chat-group-window-marks', '.contact-window-marks'],
      ['.chat-group-window-mark', '.contact-window-mark'],
      ['.chat-group-window-mark:focus-visible', '.contact-window-mark:focus-visible'],
      ['.chat-group-window-bell-icon', '.contact-window-bell-icon'],
      ['.chat-group-window-bell.is-muted', '.contact-window-bell.is-muted'],
      ['.chat-group-window-row', '.contact-window-send'],
      ['.chat-group-window-inner', '.contact-window-inner'],
      ['.chat-group-window-thread', '.contact-window-thread'],
      [
        '.chat-group-window-thread :deep(.chat-thread-scroll)',
        '.contact-window-thread :deep(.chat-thread-scroll)',
      ],
    ]

    it.each(TWINS)('%s is %s', (ours, theirs) => {
      expect(contact.get(theirs), `${theirs} is gone from the contact window`).toBeTruthy()
      expect(group.get(ours)).toBe(contact.get(theirs))
    })
  })
})
