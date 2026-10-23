// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import { BButton, BFormTextarea } from 'bootstrap-vue-next'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { AiChat } from './AiChat'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))
const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess, toastError }),
}))

const SIGNATURE_STORAGE_KEY = 'crea.moderatorSignature'

// The chat as the moderator sees it: what the bubbles say, by whom.
const bubbles = (wrapper, role) =>
  wrapper.findAll(`.${role} .inner-container span`).map((span) => span.text())
const buttonNamed = (wrapper, label) => wrapper.findAll('button').find((b) => b.text() === label)

describe('AiChat', () => {
  let sendMutate
  let deleteMutate
  let resumed

  const mountChat = async () => {
    const wrapper = mount(AiChat, {
      global: {
        // The real controls, so the tests can type and click: in the app the build
        // resolves them by name, which the tests leave out.
        components: { BButton, BFormTextarea, 'b-button': BButton },
      },
    })
    await flushPromises()
    return wrapper
  }

  const open = async (wrapper) => {
    // Closed, the chat is one button: the picture of Crea.
    await wrapper.find('button').trigger('click')
  }

  // jsdom lays nothing out and has no scrollTo; the chat scrolls to its newest message.
  beforeAll(() => {
    Element.prototype.scrollTo = vi.fn()
  })
  afterAll(() => {
    delete Element.prototype.scrollTo
  })

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    resumed = ref({ resumeChat: [] })
    sendMutate = vi.fn(async () => ({
      data: { sendMessage: { content: 'Hallo!\n[SIGNATUR]', role: 'assistant', threadId: 't-1' } },
    }))
    deleteMutate = vi.fn(async () => ({ data: { deleteThread: true } }))
    let calls = 0
    // AiChat asks for the send mutation first, then for the delete one.
    useMutation.mockImplementation(() => {
      calls += 1
      return { mutate: calls === 1 ? sendMutate : deleteMutate }
    })
    useQuery.mockReturnValue({ result: resumed, refetch: vi.fn(async () => undefined) })
  })

  it('greets with a fresh thread when nothing is stored, without showing the command', async () => {
    const wrapper = await mountChat()
    expect(sendMutate).toHaveBeenCalledWith({ input: { message: '/start', threadId: '' } })
    await open(wrapper)
    expect(bubbles(wrapper, 'user')).toEqual([])
    expect(bubbles(wrapper, 'assistant')).toEqual(['Hallo!\n[SIGNATUR]'])
  })

  it('resumes a stored thread and leaves its opening command out', async () => {
    resumed.value = {
      resumeChat: [
        { content: '/start', role: 'user', threadId: 't-9' },
        { content: 'Willkommen zurück', role: 'assistant', threadId: 't-9' },
      ],
    }
    const wrapper = await mountChat()
    expect(sendMutate).not.toHaveBeenCalled()
    await open(wrapper)
    expect(bubbles(wrapper, 'user')).toEqual([])
    expect(bubbles(wrapper, 'assistant')).toEqual(['Willkommen zurück'])
  })

  it("fills the signature into Crea's messages only, and says when there is none", async () => {
    const wrapper = await mountChat()
    await open(wrapper)
    expect(wrapper.text()).toContain('ai.signature-missing')

    localStorage.setItem(SIGNATURE_STORAGE_KEY, 'Bernd')
    // Closing and opening again reads the signature anew.
    await buttonNamed(wrapper, '').trigger('click')
    await open(wrapper)
    await wrapper.find('textarea').setValue('Gruß [SIGNATUR]')
    await buttonNamed(wrapper, 'send').trigger('click')
    await flushPromises()
    expect(bubbles(wrapper, 'assistant')).toEqual(['Hallo!\nBernd', 'Hallo!\nBernd'])
    expect(bubbles(wrapper, 'user')).toEqual(['Gruß [SIGNATUR]'])
    expect(wrapper.text()).not.toContain('ai.signature-missing')
  })

  it('sends on Ctrl+Enter and Cmd+Enter, not on Enter alone', async () => {
    const wrapper = await mountChat()
    await open(wrapper)
    const field = wrapper.find('textarea')
    await field.setValue('eins')
    await field.trigger('keydown', { key: 'Enter' })
    expect(sendMutate).toHaveBeenCalledTimes(1)
    await field.trigger('keydown', { key: 'Enter', ctrlKey: true })
    await flushPromises()
    expect(sendMutate).toHaveBeenLastCalledWith({ input: { message: 'eins', threadId: 't-1' } })
    await field.setValue('zwei')
    await field.trigger('keydown', { key: 'Enter', metaKey: true })
    await flushPromises()
    expect(sendMutate).toHaveBeenLastCalledWith({ input: { message: 'zwei', threadId: 't-1' } })
    expect(bubbles(wrapper, 'user')).toEqual(['eins', 'zwei'])
  })

  it('names an error by its code and keeps the running thread', async () => {
    const wrapper = await mountChat()
    sendMutate.mockResolvedValueOnce({
      data: { sendMessage: { content: '', role: 'assistant', errorCode: 'output_too_long' } },
    })
    await open(wrapper)
    await wrapper.find('textarea').setValue('lang')
    await buttonNamed(wrapper, 'send').trigger('click')
    await flushPromises()
    expect(wrapper.find('.error').text()).toBe('ai.error-output-too-long')
    // No copy button on an error.
    expect(wrapper.findAll('button[aria-label="copy-to-clipboard"]')).toHaveLength(1)
    await buttonNamed(wrapper, 'ai.chat-clear').trigger('click')
    await flushPromises()
    expect(deleteMutate).toHaveBeenCalledWith({ threadId: 't-1' })
  })

  it('clears the thread and lets Crea greet again', async () => {
    const wrapper = await mountChat()
    await open(wrapper)
    await buttonNamed(wrapper, 'ai.chat-clear').trigger('click')
    await flushPromises()
    expect(toastSuccess).toHaveBeenCalledWith('ai.chat-thread-deleted')
    expect(sendMutate).toHaveBeenLastCalledWith({ input: { message: '/start', threadId: '' } })
    expect(bubbles(wrapper, 'assistant')).toEqual(['Hallo!\n[SIGNATUR]'])
  })

  // Both are a picture or a symbol and nothing else (S3): the name is all a screen reader has.
  it('the opener and the close button carry names', async () => {
    const wrapper = await mountChat()
    const opener = wrapper.find('button')
    expect(opener.text()).toBe('')
    expect(opener.attributes('aria-label')).toBe('ai.chat-open')
    expect(opener.attributes('title')).toBe('ai.chat-open')

    await open(wrapper)
    // The opener is gone while the window stands, and the window closes by the named button.
    expect(wrapper.find('button[aria-label="ai.chat-open"]').exists()).toBe(false)
    const close = wrapper.find('.chat-close-button')
    expect(close.text()).toBe('')
    expect(close.attributes('aria-label')).toBe('close')
    await close.trigger('click')
    expect(wrapper.find('.chat-close-button').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="ai.chat-open"]').exists()).toBe(true)
  })

  // On a phone both are a square of 44px, as every button that is a symbol and nothing else:
  // they were 35 and 33px wide at 320 × 568 (measured 23.10.2026). The rule is App.css's and
  // holds below 992px only.
  it('the close and the copy buttons are squares to tap on a phone', async () => {
    const wrapper = await mountChat()
    await open(wrapper)
    expect(wrapper.find('.chat-close-button').classes()).toContain('phone-icon-btn')
    const copies = wrapper.findAll('button[aria-label="copy-to-clipboard"]')
    expect(copies).toHaveLength(1)
    expect(copies[0].classes()).toContain('phone-icon-btn')
  })

  it('keeps the window as it is when deleting the thread fails', async () => {
    deleteMutate.mockRejectedValueOnce(new Error('down'))
    const wrapper = await mountChat()
    await open(wrapper)
    await buttonNamed(wrapper, 'ai.chat-clear').trigger('click')
    await flushPromises()
    expect(toastError).toHaveBeenCalled()
    expect(sendMutate).toHaveBeenCalledTimes(1)
    expect(bubbles(wrapper, 'assistant')).toEqual(['Hallo!\n[SIGNATUR]'])
  })
})
