// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatGroupCreate from './ChatGroupCreate.vue'
import { createChatGroup } from '@/graphql/chatGroups.graphql'

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

/** What the server answers to createChatGroup: a test sets it. */
const opened = vi.hoisted(() => vi.fn())
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => ({ mutate: (variables) => opened(document, variables) }),
}))

const contact = (gradidoID, alias) => ({
  user: {
    communityUuid: 'home-uuid',
    communityName: 'Home',
    gradidoID,
    alias,
    avatarColorIndex: 2,
  },
  homeCommunity: true,
})
const CONTACTS = [contact('anna-id', 'Anna-Sonne'), contact('carla-id', 'Carla-Sonne')]
const GROUP = { groupUuid: 'new-uuid', conversationId: 50, title: 'Gradido-Café Berlin' }

describe('ChatGroupCreate', () => {
  let wrapper

  const mountDialog = () => {
    wrapper = mount(ChatGroupCreate, {
      props: { modelValue: false, contacts: CONTACTS },
      global: {
        stubs: {
          BModal: {
            name: 'BModal',
            props: { modelValue: Boolean, fullscreen: [String, Boolean], scrollable: Boolean },
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
          BButton: {
            template: '<button type="button" v-bind="$attrs"><slot /></button>',
          },
        },
      },
    })
    return wrapper
  }

  const find = (test) => wrapper.find(`[data-test="${test}"]`)
  const open = () => wrapper.setProps({ modelValue: true })
  const go = () => find('chat-group-create-go')
  const fill = async (title, ids = ['anna-id']) => {
    await find('chat-group-create-name').setValue(title)
    for (const id of ids) await find(`chat-group-pick-${id}`).find('input').setValue(true)
  }

  afterEach(() => {
    wrapper?.unmount()
    opened.mockReset()
  })

  it('is a sheet on a phone whose list scrolls on a desk, named "Neue Gruppe"', async () => {
    mountDialog()
    await open()
    const modal = wrapper.findComponent({ name: 'BModal' })
    expect(modal.props()).toMatchObject({ fullscreen: 'sm', scrollable: true })
    expect(modal.attributes('aria-label')).toBe('chatGroup.newTitle')
    expect(find('chat-group-create-title').text()).toBe('chatGroup.newTitle')
  })

  it('waits for a name and somebody to take in', async () => {
    mountDialog()
    await open()
    expect(go().attributes('aria-disabled')).toBe('true')
    await find('chat-group-create-name').setValue('   ')
    await find('chat-group-pick-anna-id').find('input').setValue(true)
    expect(go().attributes('aria-disabled')).toBe('true')
    await find('chat-group-create-name').setValue('Gradido-Café Berlin')
    expect(go().attributes('aria-disabled')).toBe('false')
    await find('chat-group-pick-anna-id').find('input').setValue(false)
    expect(go().attributes('aria-disabled')).toBe('true')
  })

  it('opens the group with the name as the server keeps it and the members chosen', async () => {
    opened.mockResolvedValue({ data: { createChatGroup: GROUP } })
    mountDialog()
    await open()
    await fill('  Gradido-Café   Berlin ', ['carla-id', 'anna-id'])

    await go().trigger('click')
    await flushPromises()

    expect(opened).toHaveBeenCalledWith(createChatGroup, {
      title: 'Gradido-Café Berlin',
      members: [
        { gradidoID: 'carla-id', communityUuid: 'home-uuid' },
        { gradidoID: 'anna-id', communityUuid: 'home-uuid' },
      ],
    })
    expect(wrapper.emitted('created')).toEqual([[GROUP]])
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('turns a press away while the group is not ready or on its way', async () => {
    let answer
    opened.mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve
        }),
    )
    mountDialog()
    await open()
    await go().trigger('click')
    expect(opened).not.toHaveBeenCalled()
    await fill('Garten')
    await go().trigger('click')
    await go().trigger('click')
    expect(opened).toHaveBeenCalledTimes(1)
    expect(go().attributes('aria-disabled')).toBe('true')
    answer({ data: { createChatGroup: GROUP } })
    await flushPromises()
  })

  it("says why the server refused, in the member's words, and opens nothing", async () => {
    opened.mockRejectedValue(new Error('CHAT_GROUP_NOT_CREATED: NOT_A_CONTACT'))
    mountDialog()
    await open()
    await fill('Garten')
    await go().trigger('click')
    await flushPromises()
    expect(find('chat-group-create-problem').text()).toBe('chatGroup.refusedNotAContact')
    expect(find('chat-group-create-problem').attributes('role')).toBe('alert')
    expect(wrapper.emitted('created')).toBeUndefined()
    // Changing what was refused lets the sentence go.
    await find('chat-group-create-name').setValue('Garten Pankow')
    expect(find('chat-group-create-problem').exists()).toBe(false)
  })

  it('starts empty at every opening', async () => {
    mountDialog()
    await open()
    await fill('Garten')
    await wrapper.setProps({ modelValue: false })
    await open()
    expect(find('chat-group-create-name').element.value).toBe('')
    expect(find('chat-group-pick-anna-id').find('input').element.checked).toBe(false)
  })

  it('says what taking somebody in means for them', async () => {
    mountDialog()
    await open()
    expect(find('chat-group-create-hint').text()).toBe('chatGroup.newHint')
  })
})
