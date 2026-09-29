// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import ChatVideoCall from './ChatVideoCall.vue'
import { chatVideoServerChoices } from '@/graphql/chat.graphql'
import { withChatVideoTopic } from '@/utils/chatVideoTopic'

/**
 * The questions of a video call in a group's window (E-053). How they ask, wait and open a room is
 * the contact window's spec (ContactWindow.spec.js, "the video call"), which renders this component;
 * here: what changes in a group -- the words, who gets the invitation, and the box.
 */
const words = vi.hoisted(() => ({ 'chatThread.videoTopicDefault': 'Videoanruf' }))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      typeof values === 'number'
        ? `${key}:${values}`
        : values
          ? `${key} ${JSON.stringify(values)}`
          : (words[key] ?? key),
    d: (date, format) => `${format}(${date.toISOString()})`,
    locale: { value: 'de' },
  }),
}))
vi.mock('vuex', () => ({ useStore: () => ({ state: { gradidoID: 'me-id' } }) }))

const serverRooms = vi.fn()
const serverChoices = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: {
      query: (options) =>
        options.query === chatVideoServerChoices ? serverChoices(options) : serverRooms(options),
    },
  }),
}))

const ROOM = {
  url: 'https://meet.ffmuc.net/k7m2x9q4t8wz',
  host: 'meet.ffmuc.net',
  operator: 'Freifunk München (Freie Netze München e. V.)',
}
const CAFE = 'Gradido-Café Berlin'

describe('ChatVideoCall in a group', () => {
  let wrapper
  const delivered = vi.fn()

  const mountCall = (props = {}) => {
    wrapper = mount(ChatVideoCall, {
      props: { name: CAFE, group: true, canMail: false, deliver: delivered, ...props },
      global: {
        mocks: {
          $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : (words[key] ?? key)),
        },
        stubs: {
          BModal: {
            name: 'BModal',
            props: { modelValue: Boolean },
            emits: ['update:modelValue', 'shown'],
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
          IMdiCogOutline: true,
          IMdiLinkVariant: true,
          IMdiCheck: true,
          IMdiServerOutline: true,
          IMdiCalendarPlusOutline: true,
        },
      },
    })
    return wrapper
  }
  const inDialog = (name) => wrapper.find(`[data-test="chat-video-${name}"]`)
  const ask = async () => {
    wrapper.vm.ask()
    await flushPromises()
  }

  beforeEach(() => {
    serverChoices.mockResolvedValue({ data: { chatVideoServerChoices: [] } })
    serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
    delivered.mockResolvedValue(true)
    vi.spyOn(window, 'open').mockImplementation(() => ({
      opener: window,
      closed: false,
      location: { href: '' },
      close: vi.fn(),
    }))
  })

  afterEach(() => {
    wrapper?.unmount()
    serverChoices.mockReset()
    serverRooms.mockReset()
    delivered.mockReset()
    vi.restoreAllMocks()
  })

  it('asks about the group, and says everybody in it gets the link', async () => {
    mountCall()
    await ask()
    expect(inDialog('title').text()).toBe(`chatGroup.videoAskTitle {"name":"${CAFE}"}`)
    expect(inDialog('body').text()).toBe('chatGroup.videoAskBody')
    // A plain member: nothing to send by mail (E-050 F5).
    expect(inDialog('email').exists()).toBe(false)
  })

  it('sends the invitation into the group, and by mail to nobody', async () => {
    mountCall()
    await ask()
    await inDialog('start').trigger('click')
    await flushPromises()
    expect(delivered).toHaveBeenCalledWith({
      body: `chatThread.videoInvite ${JSON.stringify({ operator: ROOM.operator, url: withChatVideoTopic(ROOM.url, 'Videoanruf') })}`,
      notify: 'NONE',
    })
  })

  // The owner and the moderators: the box sends it to everybody, as an announcement.
  it('offers the owner and the moderators the invitation by mail to everybody', async () => {
    mountCall({ canMail: true })
    await ask()
    const box = inDialog('email')
    expect(box.element.closest('label').textContent.trim()).toBe('chatGroup.videoByEmail')
    await inDialog('email').setValue(true)
    await inDialog('start').trigger('click')
    await flushPromises()
    expect(delivered).toHaveBeenCalledWith(expect.objectContaining({ notify: 'EMAIL' }))
  })

  it("plans in the group's words", async () => {
    mountCall({ canMail: true })
    await ask()
    await inDialog('gear').trigger('click')
    await flushPromises()
    expect(inDialog('settings-title').text()).toBe(
      `chatGroup.videoSettingsTitle {"name":"${CAFE}"}`,
    )
    expect(inDialog('plan-body').text()).toBe('chatGroup.videoPlanBody')
    expect(inDialog('plan-email').element.closest('label').textContent.trim()).toBe(
      'chatGroup.videoByEmail',
    )
  })

  it('asks before joining a call in the group', async () => {
    mountCall()
    wrapper.vm.askJoin(withChatVideoTopic(ROOM.url, 'Videoanruf'))
    await flushPromises()
    expect(inDialog('join-title').text()).toBe(`chatGroup.videoJoinTitle {"name":"${CAFE}"}`)
  })
})
