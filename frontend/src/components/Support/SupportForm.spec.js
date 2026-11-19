// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { BButton, BCol, BForm, BFormGroup, BRow } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __choice } from '@/composables/useCreationGroupChoice'
import CONFIG from '@/config'
import { __store } from '@/store/useWalletStore'
import { SupportForm } from './SupportForm'

const mockMutate = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockPollChatNow = vi.fn()

vi.mock('@vue/apollo-composable', () => ({ useMutation: () => ({ mutate: mockMutate }) }))
vi.mock('vue-i18n', async () => {
  const { h } = await import('vue')
  return {
    useI18n: () => ({ t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) }),
    // the sentence with a slot: its key, then what the slot puts in
    I18nT: {
      name: 'I18nT',
      props: ['keypath', 'tag'],
      setup:
        (props, { slots }) =>
        () =>
          h(props.tag ?? 'span', [`${props.keypath} `, slots.mail?.()]),
    },
  }
})
vi.mock('@/store/useWalletStore', async () => {
  const { reactive } = await import('vue')
  // the switch as the store holds it (K5): null -- not known yet --, true or false
  const store = reactive({ supportTicketsActive: null })
  return { useWalletStore: () => store, __store: store }
})
vi.mock('@/composables/useChatUpdates', () => ({
  pollChatNow: (...args) => mockPollChatNow(...args),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}))
// The group field is the contribution form's (useCreationGroupChoice has its own spec there).
vi.mock('@/composables/useCreationGroupChoice', async () => {
  const { ref } = await import('vue')
  const choice = { selected: ref(''), options: ref([]), selectedLabel: ref('') }
  return { useCreationGroupChoice: () => choice, __choice: choice }
})
vi.mock('@/components/Inputs/ValidatedInput', () => ({
  ValidatedInput: {
    name: 'ValidatedInput',
    props: ['modelValue', 'maxlength', 'label', 'placeholder', 'rules', 'name', 'textarea'],
    emits: ['update:modelValue'],
    template:
      '<textarea :maxlength="maxlength" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}))
vi.mock('@/components/ThemedSelect', () => ({
  ThemedSelect: { name: 'ThemedSelect', props: ['modelValue', 'options'], template: '<select />' },
}))

const mountForm = () =>
  mount(SupportForm, { global: { components: { BButton, BCol, BForm, BFormGroup, BRow } } })

const sendButton = (wrapper) => wrapper.find('[data-test="support-send"]')

describe('SupportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __choice.selected.value = ''
    __choice.selectedLabel.value = ''
    __store.supportTicketsActive = null
  })

  it('says who reads the request, by the group chosen', async () => {
    const wrapper = mountForm()
    expect(wrapper.text()).toContain('support.readBy.none')
    __choice.selected.value = 'garden'
    __choice.selectedLabel.value = 'Garten'
    await flushPromises()
    expect(wrapper.text()).toContain('support.readBy.group {"group":"Garten"}')
  })

  it('stops the field at the length of a message', () => {
    expect(mountForm().find('textarea').attributes('maxlength')).toBe('5000')
  })

  it('sends nothing until there are enough words', async () => {
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Hilf')
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    await wrapper.find('textarea').setValue('Hilfe!')
    expect(sendButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('files the request in the group chosen, says so, and moves on', async () => {
    mockMutate.mockResolvedValue({ data: { createSupportTicket: { id: 12 } } })
    __choice.selected.value = 'garden'
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockMutate).toHaveBeenCalledWith({
      text: 'Wie schöpfe ich?',
      creationGroupTag: 'garden',
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('support.sent')
    expect(wrapper.emitted('sent')).toHaveLength(1)
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  it('sends once, however often it is pressed while it sends, and is closed meanwhile', async () => {
    let done
    mockMutate.mockImplementation(() => new Promise((resolve) => (done = resolve)))
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    // nothing typed meanwhile can be lost with the reset after the sending
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[type="reset"]').attributes('disabled')).toBeDefined()
    await wrapper.find('form').trigger('submit')
    done({ data: { createSupportTicket: { id: 12 } } })
    await flushPromises()
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('files a request without a group as one for the community', async () => {
    mockMutate.mockResolvedValue({ data: { createSupportTicket: { id: 12 } } })
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockMutate).toHaveBeenCalledWith({ text: 'Wie schöpfe ich?', creationGroupTag: null })
  })

  it('words a refusal, and keeps the words', async () => {
    mockMutate.mockRejectedValue(new Error('SUPPORT_TICKETS_PER_DAY_REACHED'))
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockToastError).toHaveBeenCalledWith('support.perDayReached {"max":10}')
    expect(wrapper.emitted('sent')).toBeUndefined()
    expect(wrapper.find('textarea').element.value).toBe('Wie schöpfe ich?')
  })

  it('empties the words with "Abbrechen"', async () => {
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('reset')
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  /**
   * The menu's mark and entry follow the request at once, not with the next beat (K5): after a
   * request filed, and after one refused -- the refusal may be the switch.
   */
  it("asks the chat's beat at once after sending, filed or refused", async () => {
    mockMutate.mockResolvedValueOnce({ data: { createSupportTicket: { id: 12 } } })
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockPollChatNow).toHaveBeenCalledTimes(1)

    mockMutate.mockRejectedValueOnce(new Error('SUPPORT_TICKETS_PER_DAY_REACHED'))
    await wrapper.find('textarea').setValue('Noch eine Frage')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockPollChatNow).toHaveBeenCalledTimes(2)
  })

  describe('with new requests switched off (K5)', () => {
    it("has no form, and a sentence with the support's address in its place", () => {
      __store.supportTicketsActive = false
      const wrapper = mountForm()
      expect(wrapper.find('form').exists()).toBe(false)
      expect(sendButton(wrapper).exists()).toBe(false)
      const sentence = wrapper.find('[data-test="support-off"]')
      expect(sentence.text()).toContain('support.off')
      const mail = sentence.find('a')
      expect(mail.text()).toBe(CONFIG.COMMUNITY_SUPPORT_MAIL)
      expect(mail.attributes('href')).toBe(`mailto:${CONFIG.COMMUNITY_SUPPORT_MAIL}`)
    })

    it.each([
      [null, 'not known yet'],
      [true, 'on'],
    ])('keeps the form while the switch is %s (%s)', (active) => {
      __store.supportTicketsActive = active
      const wrapper = mountForm()
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('[data-test="support-off"]').exists()).toBe(false)
    })

    // a form that was open before the switch went off: the server refuses, the words stay
    it('words the refusal of the switch with the address, and keeps the words', async () => {
      mockMutate.mockRejectedValue(new Error('SUPPORT_TICKETS_OFF'))
      const wrapper = mountForm()
      await wrapper.find('textarea').setValue('Wie schöpfe ich?')
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(mockToastError).toHaveBeenCalledWith(
        `support.off ${JSON.stringify({ mail: CONFIG.COMMUNITY_SUPPORT_MAIL })}`,
      )
      expect(wrapper.emitted('sent')).toBeUndefined()
      expect(wrapper.find('textarea').element.value).toBe('Wie schöpfe ich?')
    })

    it("puts the sentence in the form's place once the store learns of the switch", async () => {
      const wrapper = mountForm()
      expect(wrapper.find('form').exists()).toBe(true)
      __store.supportTicketsActive = false
      await flushPromises()
      expect(wrapper.find('form').exists()).toBe(false)
      expect(wrapper.find('[data-test="support-off"]').exists()).toBe(true)
    })

    // A member who was typing when the switch went off keeps the words in reach, to copy them
    // into a mail; nothing can be sent, and "Abbrechen" leaves the sentence alone.
    it('keeps words typed before the switch under the sentence, with no way to send them', async () => {
      const wrapper = mountForm()
      await wrapper.find('textarea').setValue('Wie schöpfe ich?')
      __store.supportTicketsActive = false
      await flushPromises()

      expect(wrapper.find('[data-test="support-off"]').exists()).toBe(true)
      expect(wrapper.find('textarea').element.value).toBe('Wie schöpfe ich?')
      expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(mockMutate).not.toHaveBeenCalled()

      await wrapper.find('form').trigger('reset')
      await flushPromises()
      expect(wrapper.find('form').exists()).toBe(false)
      expect(wrapper.find('[data-test="support-off"]').exists()).toBe(true)
    })

    it('gives the form back, words and all, where the switch goes on again', async () => {
      const wrapper = mountForm()
      await wrapper.find('textarea').setValue('Wie schöpfe ich?')
      __store.supportTicketsActive = false
      await flushPromises()
      __store.supportTicketsActive = true
      await flushPromises()

      expect(wrapper.find('[data-test="support-off"]').exists()).toBe(false)
      expect(wrapper.find('textarea').element.value).toBe('Wie schöpfe ich?')
      expect(sendButton(wrapper).attributes('disabled')).toBeUndefined()
    })
  })
})
