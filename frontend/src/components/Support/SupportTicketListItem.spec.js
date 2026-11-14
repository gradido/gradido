// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { BAvatar, BCol, BCollapse, BRow } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VariantIcon from '@/components/VariantIcon.vue'
import { SupportTicketListItem } from './SupportTicketListItem'

const mockQuery = vi.fn()
const mockMutate = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockFetchMemberAvatars = vi.fn()

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: mockQuery } }),
  useMutation: () => ({ mutate: mockMutate }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: () => '14.11.2026',
  }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}))
vi.mock('@/composables/useMemberAvatars', () => ({
  fetchMemberAvatars: (...args) => mockFetchMemberAvatars(...args),
}))
// The thread's own pieces have their specs; here it matters what the row hands them.
vi.mock('@/components/ContributionMessages/ContributionMessagesList', () => ({
  ContributionMessagesList: {
    name: 'ContributionMessagesList',
    props: ['messages', 'status', 'contributionId', 'replyStates', 'send', 'maxLength'],
    emits: ['close-messages-list', 'add-contribution-message'],
    template: '<div class="thread" />',
  },
}))

const TICKET = {
  id: 12,
  text: 'Wie schöpfe ich?',
  status: 'OPEN',
  createdAt: '2026-11-14T08:00:00.000Z',
  creationGroupTag: 'garden',
  creationGroupName: 'Garten',
}
const MODERATION = {
  id: 7,
  message: 'Unter „Schöpfen“.',
  userGradidoID: 'peter-id',
  userCommunityUuid: 'community-id',
  userAvatarUpdatedAt: '2026-11-01T00:00:00.000Z',
}

const mountRow = (props = {}) =>
  mount(SupportTicketListItem, {
    props: { ...TICKET, ...props },
    global: { components: { BAvatar, BCol, BCollapse, BRow } },
  })

const thread = (wrapper) => wrapper.findComponent({ name: 'ContributionMessagesList' })
const signOf = (wrapper) => ({
  variant: wrapper.findComponent(BAvatar).props('variant'),
  icon: wrapper.findComponent(VariantIcon).props('icon'),
})
const answering = (messages) => ({ data: { listSupportTicketMessages: messages } })

describe('SupportTicketListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockResolvedValue(answering([MODERATION]))
  })

  it('heads the request with its number, its group and its words', () => {
    const text = mountRow().text()
    expect(text).toContain('support.number {"number":12}')
    expect(text).toContain('Garten')
    expect(text).toContain('Wie schöpfe ich?')
  })

  it('names a request without a group as such', () => {
    expect(mountRow({ creationGroupTag: null, creationGroupName: null }).text()).toContain(
      'contribution.creationGroup.none',
    )
  })

  it.each([
    ['OPEN', 'primary', 'bell-fill'],
    ['IN_PROGRESS', 'primary', 'question'],
    ['CLOSED', 'success', 'check'],
    ['DELETED', 'danger', 'trash'],
  ])('draws %s in %s with the sign %s', (status, variant, icon) => {
    expect(signOf(mountRow({ status }))).toEqual({ variant, icon })
  })

  it('asks for an answer, in red, where the moderators asked back', () => {
    const line = mountRow({ status: 'IN_PROGRESS' }).find('[data-test="support-answer-question"]')
    expect(line.classes()).toContain('text-danger')
    expect(line.text()).toContain('support.answerQuestion')
    expect(line.text()).toContain('answerNow')
    expect(mountRow().find('[data-test="support-answer-question"]').exists()).toBe(false)
  })

  it.each([
    ['OPEN', true, true],
    ['IN_PROGRESS', true, true],
    ['CLOSED', false, true],
    ['DELETED', false, false],
  ])('in %s offers "Erledigt, danke": %s, and the chat: %s', (status, done, chat) => {
    const wrapper = mountRow({ status })
    expect(wrapper.find('[data-test="support-ticket-done"]').exists()).toBe(done)
    expect(wrapper.find('[data-test="support-ticket-chat"]').exists()).toBe(chat)
  })

  describe('the thread', () => {
    it('is asked for when it is opened, and not before', async () => {
      const wrapper = mountRow()
      await flushPromises()
      expect(mockQuery).not.toHaveBeenCalled()
      await wrapper.setProps({ messagesVisible: true })
      await flushPromises()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { supportTicketId: 12 },
          fetchPolicy: 'network-only',
        }),
      )
      expect(thread(wrapper).props('messages')).toEqual([MODERATION])
    })

    it('brings the faces of its authors along, once it is there', async () => {
      mountRow({ messagesVisible: true })
      await flushPromises()
      expect(mockFetchMemberAvatars).toHaveBeenCalledWith(expect.anything(), [
        {
          gradidoID: 'peter-id',
          communityUuid: 'community-id',
          avatarUpdatedAt: '2026-11-01T00:00:00.000Z',
        },
      ])
    })

    it('is asked for again where the list reports another state for the open request', async () => {
      const wrapper = mountRow({ messagesVisible: true })
      await flushPromises()
      await wrapper.setProps({ status: 'IN_PROGRESS' })
      await flushPromises()
      expect(mockQuery).toHaveBeenCalledTimes(2)
    })

    it('takes only the answer to the newest question', async () => {
      let first
      mockQuery
        .mockImplementationOnce(() => new Promise((resolve) => (first = resolve)))
        .mockResolvedValueOnce(answering([{ ...MODERATION, id: 8, message: 'newer' }]))
      const wrapper = mountRow({ messagesVisible: true })
      await wrapper.setProps({ status: 'IN_PROGRESS' })
      await flushPromises()
      first(answering([MODERATION]))
      await flushPromises()
      expect(
        thread(wrapper)
          .props('messages')
          .map((message) => message.id),
      ).toEqual([8])
    })

    it('takes a reply in an open request, one with a question back and a closed one', () => {
      expect(thread(mountRow()).props('replyStates')).toEqual(['OPEN', 'IN_PROGRESS', 'CLOSED'])
      expect(thread(mountRow()).props('maxLength')).toBe(5000)
    })

    it('sends the words of the member in this request', async () => {
      mockMutate.mockResolvedValue({ data: { createSupportTicketMessage: { id: 9 } } })
      await expect(thread(mountRow()).props('send')('Danke!')).resolves.toEqual({ id: 9 })
      expect(mockMutate).toHaveBeenCalledWith({ supportTicketId: 12, message: 'Danke!' })
    })

    it('words a refusal of what the member wrote', async () => {
      mockMutate.mockRejectedValue(new Error('SUPPORT_TICKET_MESSAGES_REACHED'))
      await expect(thread(mountRow()).props('send')('Danke!')).rejects.toThrow(
        'support.messagesReached {"max":100}',
      )
    })

    it('opens the request again with the message the member wrote', async () => {
      const wrapper = mountRow({ status: 'CLOSED', messagesVisible: true })
      await flushPromises()
      thread(wrapper).vm.$emit('add-contribution-message', { id: 9, message: 'Noch eine Frage' })
      await flushPromises()
      expect(signOf(wrapper)).toEqual({ variant: 'primary', icon: 'bell-fill' })
      expect(
        thread(wrapper)
          .props('messages')
          .map((message) => message.id),
      ).toEqual([7, 9])
      expect(wrapper.emitted('ticket-changed')).toHaveLength(1)
    })
  })

  describe('"Erledigt, danke"', () => {
    it('closes the request, says so and draws it green', async () => {
      mockMutate.mockResolvedValue({ data: { closeSupportTicket: true } })
      const wrapper = mountRow()
      await wrapper.find('[data-test="support-ticket-done"]').trigger('click')
      await flushPromises()
      expect(mockMutate).toHaveBeenCalledWith({ supportTicketId: 12 })
      expect(mockToastSuccess).toHaveBeenCalledWith('support.closed')
      expect(signOf(wrapper)).toEqual({ variant: 'success', icon: 'check' })
      expect(wrapper.emitted('ticket-changed')).toHaveLength(1)
    })

    it('says why it did not close, and has the list asked again', async () => {
      mockMutate.mockRejectedValue(new Error('SUPPORT_TICKET_NOT_FOUND'))
      const wrapper = mountRow()
      await wrapper.find('[data-test="support-ticket-done"]').trigger('click')
      await flushPromises()
      expect(mockToastError).toHaveBeenCalledWith('support.changed')
      expect(signOf(wrapper)).toEqual({ variant: 'primary', icon: 'bell-fill' })
      expect(wrapper.emitted('ticket-changed')).toHaveLength(1)
    })

    it('closes once, however often it is pressed while it closes', async () => {
      let done
      mockMutate.mockImplementation(() => new Promise((resolve) => (done = resolve)))
      const wrapper = mountRow()
      const button = wrapper.find('[data-test="support-ticket-done"]')
      await button.trigger('click')
      await button.trigger('click')
      done({ data: { closeSupportTicket: true } })
      await flushPromises()
      expect(mockMutate).toHaveBeenCalledTimes(1)
    })
  })
})
