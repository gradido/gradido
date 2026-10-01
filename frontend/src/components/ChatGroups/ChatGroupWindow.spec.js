// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import ChatGroupWindow from './ChatGroupWindow.vue'
import { chatGroupMembersQuery, setChatGroupMuted } from '@/graphql/chatGroups.graphql'
import { SMALL_FACE_SIZE } from '@/constants'
import { CHAT_VIDEO_JOIN } from '@/utils/chatVideoApp'

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
/** The members' question (chatGroupMembersQuery): a test sets the answer. */
const asked = vi.hoisted(() => vi.fn())
/**
 * The video call's questions (ChatVideoCall, E-053) as the window calls them, and what the thread
 * answers to an invitation (`deliver`): the questions' own spec is about how they ask.
 */
const video = vi.hoisted(() => ({
  ask: vi.fn(),
  askJoin: vi.fn(),
  letGo: vi.fn(),
  duplicate: vi.fn(),
  delivers: vi.fn(),
}))
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => ({ mutate: (variables) => saved(document, variables) }),
  useApolloClient: () => ({ client: { query: (options) => asked(options) } }),
}))

const facesAsked = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useMemberAvatars', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchMemberAvatars: (...args) => facesAsked(...args),
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

const member = (gradidoID, alias, role) => ({
  user: {
    communityUuid: 'home-uuid',
    communityName: 'KI Playground',
    gradidoID,
    alias,
    avatarColorIndex: 1,
    avatarUpdatedAt: null,
  },
  role,
  joinedAt: '2026-09-27T10:00:00.000Z',
})
const MEMBERS = [
  member('anna-id', 'Anna-Sonne', 'OWNER'),
  member('me-id', 'Bernd', 'MODERATOR'),
  member('carla-id', 'Carla-Sonne', 'MEMBER'),
  member('emma-id', 'Oma-Emma', 'MEMBER'),
  member('kons-id', 'Konstantin', 'MEMBER'),
]

/** The thread's steps between hits, as the window's arrows ask for them (E-057). */
const searchSteps = []

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
            name: 'ChatThread',
            props: { group: Object, search: String },
            emits: ['openMember', 'search', 'duplicateVideo', 'forwardMessage'],
            inject: { join: { from: CHAT_VIDEO_JOIN, default: null } },
            methods: {
              deliver(message) {
                return video.delivers(message, this.group.groupUuid)
              },
              searchStep(direction) {
                searchSteps.push(direction)
              },
            },
            template:
              '<div data-test="thread" :data-group="group?.groupUuid" :data-search="search" />',
          },
          IMdiMagnify: true,
          IMdiChevronUp: true,
          IMdiChevronDown: true,
          ChatVideoCall: {
            name: 'ChatVideoCall',
            // Typed, as the real ones: an untyped `group` written bare would come as "".
            props: {
              name: String,
              group: Boolean,
              first: Boolean,
              canMail: Boolean,
              deliver: Function,
            },
            methods: {
              ask() {
                video.ask()
              },
              askJoin(roomUrl) {
                video.askJoin(roomUrl)
              },
              letGo() {
                video.letGo()
              },
              duplicate(invitation) {
                video.duplicate(invitation)
              },
            },
            template: '<div data-test="video-call" />',
          },
          // The members' dialog has its own spec; here: what it is handed, and what it says back.
          ChatGroupMembers: {
            name: 'ChatGroupMembers',
            props: ['modelValue', 'group', 'members', 'loaded', 'contacts'],
            emits: ['update:modelValue', 'changed', 'left', 'openMember'],
            template:
              '<div data-test="members-dialog" :data-open="String(modelValue)" :data-count="members.length" />',
          },
        },
      },
    })
    return wrapper
  }

  const find = (test) => wrapper.find(`[data-test="${test}"]`)

  /**
   * E-057 (Bernd, 30.09.2026): the magnifier by the cross opens the search bar; what is typed goes
   * to the group's thread, what it found comes back into the bar, and the arrows step in it.
   */
  // E-058: "Duplizieren" under an invitation in the group's thread -- the group's question again.
  it('asks the question for a duplicated invitation', async () => {
    mountWindow()
    const invitation = {
      room: 'https://meet.example.org/r',
      topic: 'Stammtisch',
      start: null,
      end: null,
    }
    await wrapper.findComponent({ name: 'ChatThread' }).vm.$emit('duplicateVideo', invitation)
    expect(video.duplicate).toHaveBeenCalledWith(invitation)
  })

  // E-059: a message to be forwarded goes up to the page, which asks where to.
  it('hands a message to be forwarded up to the page', async () => {
    mountWindow()
    const message = { id: 3, messageUuid: 'uuid-3', body: 'Flohmarkt' }
    await wrapper.findComponent({ name: 'ChatThread' }).vm.$emit('forwardMessage', message)
    expect(wrapper.emitted('forwardMessage')).toEqual([[message]])
  })

  describe('the search', () => {
    const magnifier = () => find('chat-group-window-search')
    const field = () => find('chat-search-field')

    it('opens with the magnifier and hands what is typed to the thread', async () => {
      mountWindow()
      expect(magnifier().attributes('aria-label')).toBe('chatSearch.open')
      expect(magnifier().attributes('aria-pressed')).toBe('false')
      expect(find('chat-search').exists()).toBe(false)

      await magnifier().trigger('click')
      expect(magnifier().attributes('aria-pressed')).toBe('true')
      await field().setValue('Kuchen')
      expect(find('thread').attributes('data-search')).toBe('Kuchen')
    })

    it('shows what the thread found, and steps through it with the arrows', async () => {
      mountWindow()
      await magnifier().trigger('click')
      await field().setValue('Kuchen')
      const found = { searching: true, count: 4, current: 4, busy: false, capped: false }
      await wrapper.findComponent({ name: 'ChatThread' }).vm.$emit('search', found)
      expect(find('chat-search-count').text()).toBe('chatSearch.count {"current":4,"count":4}')
      await find('chat-search-older').trigger('click')
      expect(searchSteps).toEqual([-1])
    })

    it('closes with the magnifier again, and the thread searches nothing', async () => {
      mountWindow()
      await magnifier().trigger('click')
      await field().setValue('Kuchen')
      await magnifier().trigger('click')
      expect(find('chat-search').exists()).toBe(false)
      expect(find('thread').attributes('data-search')).toBe('')
    })

    it('begins anew for another group', async () => {
      mountWindow()
      await magnifier().trigger('click')
      await field().setValue('Kuchen')
      await wrapper.setProps({ group: { ...GROUP, groupUuid: 'garden-uuid', title: 'Garten' } })
      expect(find('chat-search').exists()).toBe(false)
      expect(find('thread').attributes('data-search')).toBe('')
    })
  })
  const bell = () => find('chat-group-window-bell')

  beforeEach(() => {
    asked.mockImplementation(async () => ({ data: { chatGroupMembers: MEMBERS } }))
  })

  afterEach(() => {
    wrapper?.unmount()
    Object.values(video).forEach((spy) => spy.mockReset())
    asked.mockReset()
    facesAsked.mockClear()
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

  describe('the members', () => {
    const dialog = () => wrapper.findComponent({ name: 'ChatGroupMembers' })

    it('asks for them when the window opens, past the cache, and for their faces', async () => {
      mountWindow()
      await flushPromises()
      expect(asked).toHaveBeenCalledWith({
        query: chatGroupMembersQuery,
        variables: { groupUuid: 'cafe-uuid' },
        fetchPolicy: 'network-only',
      })
      expect(facesAsked.mock.calls.at(-1)[1].map((user) => user.gradidoID)).toEqual(
        MEMBERS.map((entry) => entry.user.gradidoID),
      )
    })

    // Up to four faces in the button, the longest-standing first; the word is the button's name.
    it('shows up to four of them in the button', async () => {
      mountWindow()
      await flushPromises()
      const button = find('chat-group-window-members')
      expect(button.findAll('.app-avatar').map((face) => face.text())).toEqual([
        'AN',
        'BE',
        'CA',
        'OM',
      ])
      expect(button.text()).toContain('chatGroup.members')
      // The faces are the button's picture, small: none of them is a button of its own.
      expect(button.find('.app-avatar').attributes('style')).toContain(
        `width: ${SMALL_FACE_SIZE}px`,
      )
      expect(button.findAll('button')).toHaveLength(0)
    })

    it('opens the dialog with the group, its members and the contacts', async () => {
      wrapper = mount(ChatGroupWindow, {
        props: { modelValue: true, group: GROUP, contacts: [{ user: { gradidoID: 'x' } }] },
        global: {
          mocks: { $t: (key) => key },
          stubs: {
            BModal: { template: '<div><slot /></div>' },
            IBiX: true,
            ChatThread: true,
            ChatGroupMembers: {
              name: 'ChatGroupMembers',
              props: ['modelValue', 'group', 'members', 'loaded', 'contacts'],
              template: '<div />',
            },
          },
        },
      })
      await flushPromises()
      expect(dialog().props('modelValue')).toBe(false)
      await find('chat-group-window-members').trigger('click')
      expect(dialog().props()).toMatchObject({
        modelValue: true,
        group: GROUP,
        loaded: true,
        contacts: [{ user: { gradidoID: 'x' } }],
      })
      expect(dialog().props('members')).toHaveLength(5)
    })

    it('asks for them again, and tells the page, when the dialog changed something', async () => {
      mountWindow()
      await flushPromises()
      asked.mockClear()
      await dialog().vm.$emit('changed')
      await flushPromises()
      expect(asked).toHaveBeenCalledTimes(1)
      expect(wrapper.emitted('changed')).toHaveLength(1)
    })

    it('closes, and tells the page, when the member left the group', async () => {
      mountWindow()
      await flushPromises()
      await dialog().vm.$emit('left')
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
      expect(wrapper.emitted('changed')).toHaveLength(1)
    })

    // Only the newest answer counts: a slow answer about the group before must not land.
    it('keeps the answer about the group on screen when two cross', async () => {
      const pending = []
      asked.mockImplementation(
        () =>
          new Promise((resolve) => {
            pending.push(resolve)
          }),
      )
      mountWindow()
      await wrapper.setProps({ group: { ...GROUP, groupUuid: 'garten-uuid' } })
      pending[1]({ data: { chatGroupMembers: MEMBERS.slice(0, 2) } })
      await flushPromises()
      pending[0]({ data: { chatGroupMembers: MEMBERS } })
      await flushPromises()
      expect(find('chat-group-window-members').findAll('.app-avatar')).toHaveLength(2)
    })

    // A list asked again for the same group (the page's reload) asks no members.
    it('does not ask again when the list only brings the same group anew', async () => {
      mountWindow()
      await flushPromises()
      asked.mockClear()
      await wrapper.setProps({ group: { ...GROUP, memberCount: 6 } })
      await flushPromises()
      expect(asked).not.toHaveBeenCalled()
    })
  })

  // E-053: a video call in the group, as with a person -- the camera beside the bell.
  describe('the video call', () => {
    const camera = () => find('chat-group-window-video')
    const call = () => wrapper.findComponent({ name: 'ChatVideoCall' })

    it('stands beside the bell, and asks the question', async () => {
      mountWindow()
      expect(camera().attributes('aria-label')).toBe(
        'chatGroup.videoCall {"name":"Gradido-Café Berlin"}',
      )
      const marks = wrapper
        .findAll('.chat-group-window-marks button')
        .map((b) => b.attributes('data-test'))
      expect(marks).toEqual(['chat-group-window-video', 'chat-group-window-bell'])
      await camera().trigger('click')
      expect(video.ask).toHaveBeenCalledTimes(1)
    })

    // Anybody may start one; by mail only the owner and the moderators (E-050 F5), and not alone.
    it.each([
      ['OWNER', 5, true],
      ['MODERATOR', 5, true],
      ['MEMBER', 5, false],
      ['OWNER', 1, false],
    ])('offers the mail to a %s among %i: %s', (role, memberCount, offered) => {
      mountWindow({ role, memberCount })
      expect(camera().exists()).toBe(true)
      expect(call().props()).toMatchObject({
        name: 'Gradido-Café Berlin',
        group: true,
        canMail: offered,
      })
      expect(call().props('first')).toBe(false)
    })

    it("sends the invitation through the group's thread", async () => {
      video.delivers.mockResolvedValue(true)
      mountWindow()
      const message = { body: 'Einladung', notify: 'EMAIL' }
      await expect(call().props('deliver')(message)).resolves.toBe(true)
      expect(video.delivers).toHaveBeenCalledWith(message, 'cafe-uuid')
    })

    // A click on the link of an invitation in the group's thread (ChatMessageText).
    it('asks before joining a call from a link in the thread', () => {
      mountWindow()
      wrapper.findComponent({ name: 'ChatThread' }).vm.join('https://meet.ffmuc.net/room')
      expect(video.askJoin).toHaveBeenCalledWith('https://meet.ffmuc.net/room')
    })

    it('lets a question go when the window comes to another group', async () => {
      mountWindow()
      await wrapper.setProps({ group: { ...GROUP, title: 'Neuer Name' } })
      expect(video.letGo).not.toHaveBeenCalled()
      await wrapper.setProps({ group: { ...GROUP, groupUuid: 'garden-uuid' } })
      expect(video.letGo).toHaveBeenCalledTimes(1)
    })
  })

  it('hands the thread its group', () => {
    mountWindow()
    expect(find('thread').attributes('data-group')).toBe('cafe-uuid')
  })

  // E-053: a name tapped over a message or in the list of members -- the page knows who is a
  // contact and leads there; the window only hands the member on, and stays as it is.
  it('hands a member named in the thread or in the list on to the page', async () => {
    mountWindow()
    await flushPromises()
    const anna = { communityUuid: 'home-uuid', gradidoID: 'anna-id', alias: 'Anna-Sonne' }
    const carla = { communityUuid: 'home-uuid', gradidoID: 'carla-id', alias: 'Carla-Sonne' }
    const members = () => wrapper.findComponent({ name: 'ChatGroupMembers' })
    await wrapper.findComponent({ name: 'ChatThread' }).vm.$emit('openMember', anna)
    await find('chat-group-window-members').trigger('click')
    await members().vm.$emit('openMember', carla)
    // Over her message Anna carries no community name; the group names its own (E-055).
    expect(wrapper.emitted('openMember')).toEqual([
      [{ ...anna, communityName: 'KI Playground' }],
      [carla],
    ])
    expect(members().props('modelValue')).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  // Only the group's own community is the group's to name; a writer of another goes as they are,
  // and a name the writer carries stays theirs.
  it("names a writer's community only where it is the group's own", async () => {
    mountWindow()
    await flushPromises()
    const thread = () => wrapper.findComponent({ name: 'ChatThread' })
    const far = { communityUuid: 'far-uuid', gradidoID: 'far-id', alias: 'Fern' }
    const loud = {
      communityUuid: 'HOME-UUID',
      gradidoID: 'x-id',
      alias: 'X',
      communityName: 'Eigen',
    }
    const upper = { communityUuid: 'HOME-UUID', gradidoID: 'y-id', alias: 'Y' }
    await thread().vm.$emit('openMember', far)
    await thread().vm.$emit('openMember', loud)
    await thread().vm.$emit('openMember', upper)
    expect(wrapper.emitted('openMember')).toEqual([
      [far],
      [loud],
      [{ ...upper, communityName: 'KI Playground' }],
    ])
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
      ['.chat-group-window-community', '.contact-window-community'],
      ['.chat-group-window-meta', '.contact-window-meta'],
      ['.chat-group-window-marks', '.contact-window-marks'],
      ['.chat-group-window-mark', '.contact-window-mark'],
      ['.chat-group-window-mark:focus-visible', '.contact-window-mark:focus-visible'],
      ['.chat-group-window-bell-icon', '.contact-window-bell-icon'],
      ['.chat-group-window-video-icon', '.contact-window-video-icon'],
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

    // ⛔ One rule differs on purpose: a group's name wraps where a person's is cut -- it may run to
    // 100 characters and is nowhere else to be read in full --, in the same font.
    it("writes the name in the contact window's font, and wraps it", () => {
      const declarations = (rule) =>
        Object.fromEntries(
          rule.split('; ').map((part) => part.split(':').map((half) => half.trim())),
        )
      const ours = declarations(group.get('.chat-group-window-name'))
      const theirs = declarations(contact.get('.contact-window-name'))
      for (const name of ['font-weight', 'font-size', 'line-height', 'min-width']) {
        expect(ours[name], name).toBe(theirs[name])
      }
      expect(theirs['white-space']).toBe('nowrap')
      expect(ours['white-space']).toBeUndefined()
      expect(ours['text-overflow']).toBeUndefined()
      expect(ours['overflow-wrap']).toBe('anywhere')
    })
  })
})
