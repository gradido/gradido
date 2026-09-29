// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatGroupMembers from './ChatGroupMembers.vue'
import {
  addChatGroupMembers,
  leaveChatGroup,
  removeChatGroupMember,
  renameChatGroup,
  setChatGroupModerator,
} from '@/graphql/chatGroups.graphql'
import { LIST_AVATAR_SIZE } from '@/constants'

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

const storeState = vi.hoisted(() => ({ gradidoID: 'me-id' }))
vi.mock('vuex', () => ({ useStore: () => ({ state: storeState }) }))

/** What the server answers to every change: a test sets it; called with document and variables. */
const server = vi.hoisted(() => vi.fn(async () => ({ data: {} })))
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => ({ mutate: (variables) => server(document, variables) }),
}))

const user = (gradidoID, alias) => ({
  communityUuid: 'home-uuid',
  communityName: 'KI Playground',
  gradidoID,
  alias,
  avatarColorIndex: 1,
  avatarUpdatedAt: null,
})
const member = (gradidoID, alias, role) => ({
  user: user(gradidoID, alias),
  role,
  joinedAt: '2026-09-27T10:00:00.000Z',
})
/** The longest-standing first, as the server sends them. */
const MEMBERS = [
  member('anna-id', 'Anna-Sonne', 'MEMBER'),
  member('me-id', 'Bernd', 'OWNER'),
  member('carla-id', 'Carla-Sonne', 'MODERATOR'),
  member('emma-id', 'Oma-Emma', 'MEMBER'),
]
const GROUP = { groupUuid: 'cafe-uuid', title: 'Gradido-Café Berlin', role: 'OWNER' }
const CONTACTS = [
  { user: user('anna-id', 'Anna-Sonne'), homeCommunity: true },
  { user: user('kons-id', 'Konstantin'), homeCommunity: true },
]

describe('ChatGroupMembers', () => {
  let wrapper

  const mountDialog = ({ role = 'OWNER', members = MEMBERS } = {}) => {
    wrapper = mount(ChatGroupMembers, {
      props: {
        modelValue: true,
        group: { ...GROUP, role },
        members,
        contacts: CONTACTS,
      },
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          BModal: {
            name: 'BModal',
            props: { modelValue: Boolean },
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
          BButton: { template: '<button type="button" v-bind="$attrs"><slot /></button>' },
          IBiX: true,
        },
      },
    })
    return wrapper
  }

  const find = (test) => wrapper.find(`[data-test="${test}"]`)
  const row = (id) => wrapper.find(`[data-test="chat-group-member-${id}"]`)
  const title = () => find('chat-group-members-title').text()
  const go = () => find('chat-group-members-go')

  afterEach(() => {
    wrapper?.unmount()
    server.mockReset()
    server.mockImplementation(async () => ({ data: {} }))
  })

  describe('the list', () => {
    it('names every member, oneself as "Du", with the parts marked', () => {
      mountDialog()
      expect(title()).toBe('chatGroup.membersTitle {"n":4}')
      const names = wrapper.findAll('[data-test="chat-group-member-name"]').map((n) => n.text())
      expect(names).toEqual([
        'Anna-Sonne',
        'chatGroup.memberYou {"name":"Bernd"}',
        'Carla-Sonne',
        'Oma-Emma',
      ])
      expect(row('me-id').find('[data-test="chat-group-member-part"]').text()).toBe(
        'chatGroup.owner',
      )
      expect(row('carla-id').find('[data-test="chat-group-member-part"]').text()).toBe(
        'chatGroup.moderator',
      )
      expect(row('anna-id').find('[data-test="chat-group-member-part"]').exists()).toBe(false)
    })

    // E-053: somebody else's name leads to them -- the page decides where (their window, or the
    // send form). One's own is words, and nothing else in the row moves.
    it('leads to somebody else by their name, not to oneself', async () => {
      mountDialog()
      const link = row('carla-id').find('[data-test="member-name-open"]')
      expect(link.element.tagName).toBe('BUTTON')
      expect(link.text()).toBe('Carla-Sonne')
      expect(row('me-id').find('[data-test="member-name-open"]').exists()).toBe(false)

      await link.trigger('click')
      expect(wrapper.emitted('openMember')).toEqual([[MEMBERS[2].user]])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(find('chat-group-member-menu').exists()).toBe(false)
    })

    it('shows every face at the size of the lists', () => {
      mountDialog()
      expect(row('anna-id').find('.app-avatar').attributes('style')).toContain(
        `width: ${LIST_AVATAR_SIZE}px`,
      )
    })

    // E-050 F4: the owner with everybody else, a moderator with plain members, a member with none.
    it('offers the steps the member may take, at whom they may take them', () => {
      const withMenu = () =>
        MEMBERS.map((entry) => entry.user.gradidoID).filter((id) =>
          row(id).find('[data-test="chat-group-member-more"]').exists(),
        )
      mountDialog({ role: 'OWNER' })
      expect(withMenu()).toEqual(['anna-id', 'carla-id', 'emma-id'])
      wrapper.unmount()

      const asModerator = [
        member('anna-id', 'Anna-Sonne', 'OWNER'),
        member('me-id', 'Bernd', 'MODERATOR'),
        member('carla-id', 'Carla-Sonne', 'MODERATOR'),
        member('emma-id', 'Oma-Emma', 'MEMBER'),
      ]
      mountDialog({ role: 'MODERATOR', members: asModerator })
      expect(
        asModerator
          .map((entry) => entry.user.gradidoID)
          .filter((id) => row(id).find('[data-test="chat-group-member-more"]').exists()),
      ).toEqual(['emma-id'])
      wrapper.unmount()

      mountDialog({ role: 'MEMBER' })
      expect(withMenu()).toEqual([])
    })

    // The member's part comes from the list of groups, the members from their own question: the
    // two can disagree for a moment (a part changed in between). Oneself is never offered a step
    // -- leaving is its own button.
    it("never offers a step at oneself, also where the two lists disagree about one's part", () => {
      mountDialog({
        role: 'OWNER',
        members: [member('me-id', 'Bernd', 'MEMBER'), member('emma-id', 'Oma-Emma', 'MEMBER')],
      })
      expect(row('me-id').find('[data-test="chat-group-member-more"]').exists()).toBe(false)
      expect(row('emma-id').find('[data-test="chat-group-member-more"]').exists()).toBe(true)
    })

    it('offers taking people in and renaming to the owner and the moderators only', () => {
      for (const [role, offered] of [
        ['OWNER', true],
        ['MODERATOR', true],
        ['MEMBER', false],
      ]) {
        mountDialog({ role })
        expect({
          role,
          add: find('chat-group-members-add').exists(),
          rename: find('chat-group-members-rename').exists(),
        }).toEqual({ role, add: offered, rename: offered })
        // Everybody may leave.
        expect(find('chat-group-members-leave').exists()).toBe(true)
        wrapper.unmount()
      }
      wrapper = null
    })

    it('says the members are still being asked for, while they are', () => {
      wrapper = mount(ChatGroupMembers, {
        props: { modelValue: true, group: GROUP, members: [], loaded: false, contacts: [] },
        global: {
          mocks: { $t: (key) => key },
          stubs: {
            BModal: { props: { modelValue: Boolean }, template: '<div><slot /></div>' },
            BButton: true,
            IBiX: true,
          },
        },
      })
      expect(find('chat-group-members-loading').text()).toBe('chatGroup.membersLoading')
    })
  })

  describe("a member's steps", () => {
    const openMenu = (id) => row(id).find('[data-test="chat-group-member-more"]').trigger('click')

    it('makes a member a moderator, and says so to the window', async () => {
      mountDialog()
      await openMenu('anna-id')
      const make = row('anna-id').find('[data-test="chat-group-member-moderator"]')
      expect(make.text()).toBe('chatGroup.moderatorOn')
      await make.trigger('click')
      await flushPromises()
      expect(server).toHaveBeenCalledWith(setChatGroupModerator, {
        groupUuid: 'cafe-uuid',
        member: { gradidoID: 'anna-id', communityUuid: 'home-uuid' },
        moderator: true,
      })
      expect(wrapper.emitted('changed')).toHaveLength(1)
    })

    it('takes a moderator back', async () => {
      mountDialog()
      await openMenu('carla-id')
      const back = row('carla-id').find('[data-test="chat-group-member-moderator"]')
      expect(back.text()).toBe('chatGroup.moderatorOff')
      await back.trigger('click')
      await flushPromises()
      expect(server).toHaveBeenCalledWith(
        setChatGroupModerator,
        expect.objectContaining({ moderator: false }),
      )
    })

    // Only the owner makes moderators (E-050 F4).
    it('offers no moderator step to a moderator', async () => {
      mountDialog({
        role: 'MODERATOR',
        members: [member('me-id', 'Bernd', 'MODERATOR'), member('emma-id', 'Oma-Emma', 'MEMBER')],
      })
      await openMenu('emma-id')
      expect(row('emma-id').find('[data-test="chat-group-member-moderator"]').exists()).toBe(false)
      expect(row('emma-id').find('[data-test="chat-group-member-remove"]').exists()).toBe(true)
    })

    it("says why the server refused, in the member's words", async () => {
      server.mockRejectedValue(new Error('CHAT_GROUP_NOT_CHANGED: TOO_MANY_MODERATORS'))
      mountDialog()
      await openMenu('anna-id')
      await row('anna-id').find('[data-test="chat-group-member-moderator"]').trigger('click')
      await flushPromises()
      expect(find('chat-group-members-problem').text()).toBe('chatGroup.refusedTooManyModerators')
      expect(wrapper.emitted('changed')).toBeUndefined()
    })

    // A step only somebody else can undo is asked first.
    it('asks before taking somebody out, and takes them out on the answer', async () => {
      mountDialog()
      await openMenu('emma-id')
      await row('emma-id').find('[data-test="chat-group-member-remove"]').trigger('click')

      expect(title()).toBe('chatGroup.removeTitle {"name":"Oma-Emma"}')
      expect(find('chat-group-members-question').text()).toBe(
        'chatGroup.removeBody {"name":"Oma-Emma"}',
      )
      expect(server).not.toHaveBeenCalled()

      await go().trigger('click')
      await flushPromises()
      expect(server).toHaveBeenCalledWith(removeChatGroupMember, {
        groupUuid: 'cafe-uuid',
        member: { gradidoID: 'emma-id', communityUuid: 'home-uuid' },
      })
      expect(wrapper.emitted('changed')).toHaveLength(1)
      expect(title()).toBe('chatGroup.membersTitle {"n":4}')
    })

    // coderabbit, #4013: while a moderator step is on its way, taking somebody out waits -- the
    // step's refusal would otherwise stand under the question about somebody else.
    it('turns taking somebody out away while a moderator step is on its way', async () => {
      let answer
      server.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            answer = { resolve, reject }
          }),
      )
      mountDialog()
      await openMenu('anna-id')
      await row('anna-id').find('[data-test="chat-group-member-moderator"]').trigger('click')
      const remove = row('anna-id').find('[data-test="chat-group-member-remove"]')
      expect(remove.attributes('aria-disabled')).toBe('true')
      await remove.trigger('click')
      expect(find('chat-group-members-question').exists()).toBe(false)

      answer.reject(new Error('CHAT_GROUP_NOT_CHANGED: TOO_MANY_MODERATORS'))
      await flushPromises()
      // The refusal stands in the list, where the step was taken.
      expect(title()).toBe('chatGroup.membersTitle {"n":4}')
      expect(find('chat-group-members-problem').text()).toBe('chatGroup.refusedTooManyModerators')
      expect(
        row('anna-id').find('[data-test="chat-group-member-remove"]').attributes('aria-disabled'),
      ).toBe('false')
    })

    it('takes nobody out where the member thinks better of it', async () => {
      mountDialog()
      await openMenu('emma-id')
      await row('emma-id').find('[data-test="chat-group-member-remove"]').trigger('click')
      await find('chat-group-members-back').trigger('click')
      expect(server).not.toHaveBeenCalled()
      expect(title()).toBe('chatGroup.membersTitle {"n":4}')
    })
  })

  describe('taking people in', () => {
    it("offers the member's contacts who are not in the group yet", async () => {
      mountDialog()
      await find('chat-group-members-add').trigger('click')
      expect(title()).toBe('chatGroup.addMembers')
      expect(wrapper.findAll('.chat-group-pick-name').map((name) => name.text())).toEqual([
        'Konstantin',
      ])
      expect(find('chat-group-members-add-hint').text()).toBe('chatGroup.addHint')
    })

    it('takes the chosen ones in, and goes back to the list', async () => {
      mountDialog()
      await find('chat-group-members-add').trigger('click')
      expect(go().attributes('aria-disabled')).toBe('true')
      await wrapper.find('[data-test="chat-group-pick-kons-id"] input').setValue(true)
      await go().trigger('click')
      await flushPromises()
      expect(server).toHaveBeenCalledWith(addChatGroupMembers, {
        groupUuid: 'cafe-uuid',
        members: [{ gradidoID: 'kons-id', communityUuid: 'home-uuid' }],
      })
      expect(wrapper.emitted('changed')).toHaveLength(1)
      expect(title()).toBe('chatGroup.membersTitle {"n":4}')
    })
  })

  describe('a new name', () => {
    it('starts from the name the group has, and saves the name as the server keeps it', async () => {
      mountDialog()
      await find('chat-group-members-rename').trigger('click')
      expect(find('chat-group-members-name').element.value).toBe('Gradido-Café Berlin')
      // The same name is no change.
      expect(go().attributes('aria-disabled')).toBe('true')
      await find('chat-group-members-name').setValue('  Café   Pankow ')
      await go().trigger('click')
      await flushPromises()
      expect(server).toHaveBeenCalledWith(renameChatGroup, {
        groupUuid: 'cafe-uuid',
        title: 'Café Pankow',
      })
      expect(wrapper.emitted('changed')).toHaveLength(1)
    })
  })

  describe('leaving', () => {
    // The server's rule (P5a): the longest-standing moderator takes over, else the member.
    it('asks first, and tells an owner who takes over', async () => {
      mountDialog()
      await find('chat-group-members-leave').trigger('click')
      expect(title()).toBe('chatGroup.leaveTitle {"name":"Gradido-Café Berlin"}')
      expect(find('chat-group-members-question').text()).toBe(
        'chatGroup.leaveBodyOwner {"name":"Carla-Sonne"}',
      )
    })

    it('names the longest-standing member where there is no moderator', async () => {
      mountDialog({
        members: [
          member('me-id', 'Bernd', 'OWNER'),
          member('emma-id', 'Oma-Emma', 'MEMBER'),
          member('anna-id', 'Anna-Sonne', 'MEMBER'),
        ],
      })
      await find('chat-group-members-leave').trigger('click')
      expect(find('chat-group-members-question').text()).toBe(
        'chatGroup.leaveBodyOwner {"name":"Oma-Emma"}',
      )
    })

    it('tells anybody else only how to come back', async () => {
      mountDialog({ role: 'MEMBER' })
      await find('chat-group-members-leave').trigger('click')
      expect(find('chat-group-members-question').text()).toBe('chatGroup.leaveBody')
    })

    it('leaves on the answer, and says so to the window', async () => {
      mountDialog()
      await find('chat-group-members-leave').trigger('click')
      await go().trigger('click')
      await flushPromises()
      expect(server).toHaveBeenCalledWith(leaveChatGroup, { groupUuid: 'cafe-uuid' })
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
      expect(wrapper.emitted('left')).toHaveLength(1)
    })
  })

  it('shows the list at every opening', async () => {
    mountDialog()
    await find('chat-group-members-leave').trigger('click')
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(title()).toBe('chatGroup.membersTitle {"n":4}')
  })

  // Measured in the bundle at 320 px (29.09.2026): beside a long name, "Moderator" and the dots,
  // a face in a flex row shrinks unless it is told not to.
  it('keeps the faces at their size however long the names', () => {
    const code = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatGroupMembers.vue'),
      'utf8',
    )
      .split('<style')[1]
      .replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = [...code.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, selectors]) =>
      selectors
        .split(',')
        .some((selector) => selector.trim() === '.chat-group-member-line .app-avatar'),
    )
    expect(rule?.[2]).toMatch(/flex:\s*0 0 auto/)
  })
})
