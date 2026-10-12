// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChatComposeBar from './ChatComposeBar.vue'
import { chatDraftFor, forgetChatDrafts } from '@/utils/chatDraft'
import { CHAT_IMAGE_UNEDITED } from '@/utils/chatImageEdit'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

vi.mock('@/utils/isComputer', () => ({ isComputer: () => true }))

// The smiley has a spec of its own (ChatComposeBar.emoji.spec.js); here the bar stands without.
vi.mock('@/utils/emojiChoice', async (importOriginal) => ({
  ...(await importOriginal()),
  offersEmojiPicker: () => false,
}))

/** Opening a picture and making it small answer as a test says (utils/chatImage.spec.js). */
const encoding = vi.hoisted(() => ({ openChatImage: vi.fn(), encodeChatImage: vi.fn() }))
vi.mock('@/utils/chatImage', async (importOriginal) => ({
  chatImageProblemWords: (await importOriginal()).chatImageProblemWords,
  openChatImage: (...args) => encoding.openChatImage(...args),
  encodeChatImage: (...args) => encoding.encodeChatImage(...args),
}))

/**
 * What is written and not sent waits for the next bar of the conversation (Bernd, 11.10.2026,
 * after a tester's report: the window closed, and words and picture were gone). The bar's half:
 * it begins with what waits and says every change -- held here against the real drafts
 * (utils/chatDraft), so a bar that is gone and the next one made are the way a window closes and
 * opens again.
 */
describe('ChatComposeBar and the draft of its conversation', () => {
  let wrapper
  /** Who is signed in, as the store would say it. */
  let signedIn

  const draftOf = (thread = 'home-uuid/lena-id') => chatDraftFor(() => signedIn, thread)

  const mountBar = (props = {}, options = {}) => {
    wrapper = mount(ChatComposeBar, {
      props: {
        name: 'Lena',
        first: false,
        sending: false,
        failed: false,
        draft: draftOf(),
        ...props,
      },
      global: {
        stubs: {
          IMdiEmailOutline: true,
          IMdiSend: true,
          IMdiPaperclip: true,
          IMdiImage: true,
          IMdiCamera: true,
          IMdiFileDocument: true,
          IMdiClose: true,
          IMdiPencil: true,
          IMdiPencilOutline: true,
          IMdiCheck: true,
          IMdiReplyOutline: true,
          IMdiImageOutline: true,
          IMdiCellphone: true,
          IMdiOpenInNew: true,
          ChatImageEditor: {
            name: 'ChatImageEditor',
            props: ['modelValue', 'source', 'edit'],
            emits: ['update:modelValue', 'done'],
            template: '<div data-test="chat-image-editor-stub" />',
          },
          BModal: {
            name: 'BModal',
            props: { modelValue: Boolean },
            emits: ['update:modelValue'],
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
        },
      },
      ...options,
    })
    return wrapper
  }

  /** The window closes: the bar is gone. And opens again: a new bar for the same conversation. */
  const closeWindow = () => {
    wrapper.unmount()
    wrapper = null
  }
  const openAgain = (props = {}) => mountBar(props)

  const field = () => wrapper.find('[data-test="chat-compose-field"]')
  const button = () => wrapper.find('[data-test="chat-compose-send"]')
  const box = () => wrapper.find('[data-test="chat-compose-email"]')
  const attached = () => wrapper.find('[data-test="chat-compose-attached"]')
  const editor = () => wrapper.findComponent({ name: 'ChatImageEditor' })
  const sent = () => wrapper.emitted('send') ?? []

  /** A picture chosen, as the device's picker answers. */
  const READY = { image: { name: 'ready' }, width: 4000, height: 3000 }
  const pick = async () => {
    const picker = wrapper.find('[data-test="chat-compose-picker"]')
    Object.defineProperty(picker.element, 'files', {
      value: [new File(['JPEG'], 'photo.jpg', { type: 'image/jpeg' })],
      configurable: true,
    })
    await picker.trigger('change')
  }
  const choose = async (ready = READY) => {
    encoding.openChatImage.mockResolvedValueOnce(ready)
    await pick()
    await flushPromises()
  }

  /** The message went on its way and came back: through, or not. */
  const underway = () => wrapper.setProps({ sending: true, failed: false })
  const wentThrough = async () => {
    await wrapper.setProps({ sending: false, failed: false })
    await flushPromises()
  }
  const didNotGo = async () => {
    await wrapper.setProps({ sending: false, failed: true })
    await flushPromises()
  }

  beforeEach(() => {
    signedIn = 'me-id'
    // jsdom's canvas draws nothing; the preview has its own tests.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      drawImage: () => {},
    }))
    encoding.encodeChatImage.mockResolvedValue({ data: 'JPEG', width: 800, height: 600 })
    // The two frames the bar lets the browser paint before a picture is made small, at once.
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback()
      return 0
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    forgetChatDrafts()
    window.localStorage.clear()
    encoding.openChatImage.mockReset()
    encoding.encodeChatImage.mockReset()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('the words', () => {
    // The report: written, the window closed, opened again -- gone.
    it('stand in the field again when the window is opened again', async () => {
      mountBar()
      await field().setValue('Bis Samstag um zehn?')
      closeWindow()

      openAgain()

      expect(field().element.value).toBe('Bis Samstag um zehn?')
    })

    it('are kept with the change itself, not when the window closes', () => {
      mountBar()
      field().element.value = 'Bis'
      field().trigger('input')

      expect(draftOf().read().text).toBe('Bis')
    })

    it('are the draft of this conversation only', async () => {
      mountBar()
      await field().setValue('für Lena')
      closeWindow()

      openAgain({ draft: draftOf('home-uuid/anna-id') })

      expect(field().element.value).toBe('')
    })

    it('are no draft any more once the field was emptied', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await field().setValue('')

      expect(draftOf().read()).toBeNull()
    })

    it('let the arrow send them at once in the bar they came back into', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      closeWindow()
      openAgain()

      await button().trigger('click')

      expect(sent()[0][0]).toEqual(expect.objectContaining({ body: 'Bis Samstag' }))
    })

    it('are not written anywhere by a bar that was only opened and closed', () => {
      const draft = { read: vi.fn(() => null), keep: vi.fn() }
      mountBar({ draft })
      closeWindow()

      expect(draft.keep).not.toHaveBeenCalled()
    })
  })

  /**
   * The window hands words in -- "Hallo Lena" for a first word, the sentence of the map's profile
   * window. They are the window's to give again, and no draft of the member's until changed.
   */
  describe('the words the window hands in', () => {
    it('stand in the field where no draft waits', () => {
      mountBar({ initialText: 'Hallo Lena' })

      expect(field().element.value).toBe('Hallo Lena')
    })

    it('are no draft where another change is noted beside them', async () => {
      mountBar({ initialText: 'Hallo Lena' })
      await box().setValue(true)

      expect(draftOf().read()).toBeNull()
    })

    it('give way to what the member made of them', async () => {
      mountBar({ initialText: 'Hallo Lena' })
      await field().setValue('Hallo Lena, schön Dich hier zu treffen!')
      closeWindow()

      openAgain({ initialText: 'Hallo Lena' })

      expect(field().element.value).toBe('Hallo Lena, schön Dich hier zu treffen!')
    })

    it('are back where the member emptied the field and left', async () => {
      mountBar({ initialText: 'Hallo Lena' })
      await field().setValue('')
      closeWindow()

      openAgain({ initialText: 'Hallo Lena' })

      expect(field().element.value).toBe('Hallo Lena')
    })

    it('are no draft again once the member wrote them back as they were', async () => {
      mountBar({ initialText: 'Hallo Lena' })
      await field().setValue('Hallo Lena!')
      await field().setValue('Hallo Lena')

      expect(draftOf().read()).toBeNull()
    })
  })

  describe('the picture', () => {
    it('stands over the field again when the window is opened again', async () => {
      mountBar()
      await choose()
      closeWindow()

      openAgain()

      expect(attached().exists()).toBe(true)
      expect(editor().props('source')).toBe(READY)
    })

    it('comes back as the member cut it', async () => {
      const cut = { ...CHAT_IMAGE_UNEDITED, turn: 1, shape: 'square' }
      mountBar()
      await choose()
      await editor().vm.$emit('done', cut)
      closeWindow()

      openAgain()

      expect(editor().props('edit')).toEqual(cut)
    })

    it('goes out with the message from the bar it came back into', async () => {
      mountBar()
      await choose()
      closeWindow()
      openAgain()

      await button().trigger('click')
      await flushPromises()

      expect(encoding.encodeChatImage).toHaveBeenCalledWith(READY, CHAT_IMAGE_UNEDITED)
      expect(sent()[0][0].image).toEqual({ data: 'JPEG', width: 800, height: 600 })
    })

    it('has its preview drawn in the bar it came back into', async () => {
      mountBar()
      await choose()
      closeWindow()
      HTMLCanvasElement.prototype.getContext.mockClear()

      openAgain()

      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled()
    })

    it('is no draft any more once it was taken off', async () => {
      mountBar()
      await choose()
      await wrapper.find('[data-test="chat-compose-attached-remove"]').trigger('click')

      expect(draftOf().read()).toBeNull()
    })

    it('waits with the words written beside it', async () => {
      mountBar()
      await field().setValue('Unser Stand')
      await choose()
      closeWindow()

      openAgain()

      expect(field().element.value).toBe('Unser Stand')
      expect(attached().exists()).toBe(true)
    })

    /**
     * The window hands in a greeting; the member emptied the field and chose a picture. The
     * greeting is not that picture's caption when the window opens again.
     */
    it('comes back without the words the window hands in, where the member had emptied the field', async () => {
      mountBar({ initialText: 'Hallo Lena' })
      await field().setValue('')
      await choose()
      closeWindow()

      openAgain({ initialText: 'Hallo Lena' })

      expect(attached().exists()).toBe(true)
      expect(field().element.value).toBe('')
    })

    // ... and with them where the bar cannot show the picture: there the window's words stand.
    it('leaves the window its words in a bar that takes only text', async () => {
      mountBar()
      await choose()
      closeWindow()

      openAgain({ textOnly: true, initialText: 'Hallo Lena' })

      expect(attached().exists()).toBe(false)
      expect(field().element.value).toBe('Hallo Lena')
    })

    // A bar that takes no picture shows none, and so sends none.
    it('is not shown in a bar that takes only text', async () => {
      mountBar()
      await field().setValue('Unser Stand')
      await choose()
      closeWindow()

      openAgain({ textOnly: true })

      expect(attached().exists()).toBe(false)
      expect(field().element.value).toBe('Unser Stand')
    })
  })

  /** The box is the wish for one message: it comes back where the member set it themselves. */
  describe('the box', () => {
    it('comes back ticked where the member ticked it for the words that wait', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await box().setValue(true)
      closeWindow()

      openAgain()

      expect(box().element.checked).toBe(true)
    })

    it('comes back empty where the member emptied the one that begins ticked', async () => {
      mountBar({ firstOwn: true })
      await field().setValue('Hallo zurück')
      await box().setValue(false)
      closeWindow()

      openAgain({ firstOwn: true })

      expect(box().element.checked).toBe(false)
    })

    // What the bar ticked by itself is no setting of the member's: the next bar decides anew.
    it('is decided anew where the member never touched it', async () => {
      mountBar({ firstOwn: true })
      await field().setValue('Hallo zurück')
      closeWindow()
      expect(draftOf().read().alsoByEmail).toBeNull()

      openAgain({ firstOwn: false })

      expect(box().element.checked).toBe(false)
    })

    it('stays the member’s in the bar it came back into, whatever arrives', async () => {
      mountBar({ firstOwn: true })
      await field().setValue('Hallo zurück')
      await box().setValue(false)
      closeWindow()
      openAgain({ firstOwn: false })

      await wrapper.setProps({ firstOwn: true })

      expect(box().element.checked).toBe(false)
    })

    it('is kept with a tick alone, without a change of the words', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      const kept = vi.spyOn(wrapper.props('draft'), 'keep')

      await box().setValue(true)

      expect(kept).toHaveBeenLastCalledWith(
        expect.objectContaining({ text: 'Bis Samstag', alsoByEmail: true }),
      )
    })
  })

  /**
   * ⛔ What a press sent on its way is a draft no longer: a window closed over a message on its
   * way must not hand its words to the next bar, to be sent a second time.
   */
  describe('a message on its way', () => {
    it('is no draft from the press on', async () => {
      mountBar()
      await field().setValue('Bis Samstag')

      await button().trigger('click')

      expect(sent()).toHaveLength(1)
      expect(draftOf().read()).toBeNull()
    })

    it('leaves the next bar empty where the window closed over it', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await button().trigger('click')
      await underway()
      closeWindow()

      openAgain()

      expect(field().element.value).toBe('')
    })

    it('leaves no draft behind once it went through', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await button().trigger('click')
      await underway()

      await wentThrough()

      expect(field().element.value).toBe('')
      expect(draftOf().read()).toBeNull()
    })

    it('is the draft again where it did not go through', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await button().trigger('click')
      await underway()

      await didNotGo()

      expect(draftOf().read().text).toBe('Bis Samstag')
      closeWindow()
      openAgain()
      expect(field().element.value).toBe('Bis Samstag')
    })

    it('takes its picture out of the draft as well, and gives it back where it did not go', async () => {
      mountBar()
      await choose()
      await button().trigger('click')
      await flushPromises()
      expect(draftOf().read()).toBeNull()
      await underway()

      await didNotGo()

      expect(draftOf().read().picture).toEqual({ source: READY, edit: CHAT_IMAGE_UNEDITED })
    })

    it('leaves what was typed behind it as the draft', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await button().trigger('click')
      await underway()
      await field().setValue('Bis Samstag um zehn')

      expect(draftOf().read().text).toBe('Bis Samstag um zehn')
      await wentThrough()
      expect(draftOf().read().text).toBe('Bis Samstag um zehn')
    })

    // The wish went with the message it was ticked for.
    it('takes the tick with it that was set for it', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await box().setValue(true)
      await button().trigger('click')
      await underway()
      await field().setValue('Bis Samstag um zehn')

      expect(draftOf().read()).toEqual(
        expect.objectContaining({ text: 'Bis Samstag um zehn', alsoByEmail: false }),
      )
    })

    /**
     * A bar that is gone sends nothing: its `send` is heard by nobody. So where the window
     * closes while the picture is still made small, nothing has gone out -- and words and picture
     * wait as the draft they are.
     */
    it('has not left where the window closed while its picture was made small', async () => {
      let small
      encoding.encodeChatImage.mockReturnValueOnce(
        new Promise((resolve) => {
          small = resolve
        }),
      )
      mountBar()
      await field().setValue('Unser Stand')
      await choose()
      await button().trigger('click')
      closeWindow()

      small({ data: 'JPEG', width: 800, height: 600 })
      await flushPromises()

      expect(draftOf().read()).toEqual(
        expect.objectContaining({
          text: 'Unser Stand',
          picture: { source: READY, edit: CHAT_IMAGE_UNEDITED },
        }),
      )
    })
  })

  /** A short answer (E-069) sends its own words: what is typed in the field stays there. */
  describe('a short answer', () => {
    it('leaves the draft as it stands', async () => {
      mountBar({ helloBack: true, firstOwn: true })
      await field().setValue('Und noch etwas:')

      await wrapper.find('[data-test="chat-compose-hello-back-hello"]').trigger('click')
      await underway()
      await wentThrough()

      expect(draftOf().read().text).toBe('Und noch etwas:')
    })

    /**
     * The box's wish goes with the short answer, as with any message -- also where the window
     * closes while the answer is on its way, and this bar never comes to empty the box.
     */
    it('takes the tick with it that the member had set', async () => {
      mountBar({ helloBack: true, firstOwn: true })
      await field().setValue('Und noch etwas:')
      await box().setValue(false)
      await box().setValue(true)
      expect(draftOf().read().alsoByEmail).toBe(true)

      await wrapper.find('[data-test="chat-compose-hello-back-hello"]').trigger('click')
      await underway()
      closeWindow()

      expect(draftOf().read()).toEqual(
        expect.objectContaining({ text: 'Und noch etwas:', alsoByEmail: false }),
      )
      openAgain({ firstOwn: false })
      expect(box().element.checked).toBe(false)
    })
  })

  /**
   * While a message is being changed (E-060) its text stands in the field, and what stood there
   * before waits. The draft is what waits -- never the text of the message being changed.
   */
  describe('while a message is being changed', () => {
    const MESSAGE = {
      messageUuid: 'uuid-7',
      body: 'Der Hofflohmarkt ist am Samstag.',
      hasImage: false,
    }
    const startEditing = async () => {
      await wrapper.setProps({ editing: MESSAGE })
      await flushPromises()
    }
    const stopEditing = async () => {
      await wrapper.setProps({ editing: null })
      await flushPromises()
    }

    it('keeps the words that wait as the draft, not the message’s text', async () => {
      mountBar()
      await field().setValue('Bis Samstag')

      await startEditing()
      await field().setValue('Der Hofflohmarkt ist am Sonntag.')

      expect(draftOf().read().text).toBe('Bis Samstag')
    })

    it('keeps no draft where nothing waited', async () => {
      mountBar()

      await startEditing()
      await field().setValue('Der Hofflohmarkt ist am Sonntag.')

      expect(draftOf().read()).toBeNull()
    })

    it('hands the words that waited to the next bar where the window closes over the change', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await startEditing()
      closeWindow()

      openAgain()

      expect(field().element.value).toBe('Bis Samstag')
    })

    it('keeps the picture that waits', async () => {
      mountBar()
      await choose()

      await startEditing()

      expect(attached().exists()).toBe(false)
      expect(draftOf().read().picture).toEqual({ source: READY, edit: CHAT_IMAGE_UNEDITED })
    })

    // Chosen just before "Bearbeiten", opened only after: it waits with the words that wait.
    it('keeps a picture that was still being opened when the change began', async () => {
      let opened
      encoding.openChatImage.mockReturnValueOnce(
        new Promise((resolve) => {
          opened = resolve
        }),
      )
      mountBar()
      await field().setValue('Unser Stand')
      await pick()
      await startEditing()

      opened(READY)
      await flushPromises()

      expect(draftOf().read()).toEqual(
        expect.objectContaining({
          text: 'Unser Stand',
          picture: { source: READY, edit: CHAT_IMAGE_UNEDITED },
        }),
      )
    })

    /**
     * Sent, and "Bearbeiten" pressed at another message while it was on its way: what went out
     * waits under the change, and is cleared there when it has gone through -- the draft with it.
     */
    it('leaves no draft of a message that went through while another was being changed', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await button().trigger('click')
      await underway()
      await startEditing()

      await wentThrough()

      expect(draftOf().read()).toBeNull()
      await stopEditing()
      expect(field().element.value).toBe('')
      expect(draftOf().read()).toBeNull()
    })

    // What comes in for a bar that is gone has no bar to stand in: it is kept for none.
    it('keeps nothing that comes in after the window closed', async () => {
      let opened
      encoding.openChatImage.mockReturnValueOnce(
        new Promise((resolve) => {
          opened = resolve
        }),
      )
      mountBar()
      await field().setValue('Unser Stand')
      await pick()
      await startEditing()
      closeWindow()

      opened(READY)
      await flushPromises()

      expect(draftOf().read()).toEqual({ text: 'Unser Stand', picture: null, alsoByEmail: null })
    })

    it('has the draft as it was once the change ended', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await box().setValue(true)
      await startEditing()

      await stopEditing()

      expect(field().element.value).toBe('Bis Samstag')
      expect(draftOf().read()).toEqual(
        expect.objectContaining({ text: 'Bis Samstag', alsoByEmail: true }),
      )
    })
  })

  /** One browser serves several members: a draft is its member's (utils/chatDraft). */
  describe('whose it is', () => {
    it('does not stand in the bar of another member signed in here', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      closeWindow()

      signedIn = 'somebody-else'
      openAgain()

      expect(field().element.value).toBe('')
    })

    /**
     * A wallet left in a thread is signed out while the bar still stands for a moment. What the
     * bar says after that is kept for nobody.
     *
     * By the member's own word the drafts are gone from the device as well, and the bar must
     * not put its own back.
     */
    it('is not put back by a bar that still stands after its member signed out', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      forgetChatDrafts('me-id', { fromDevice: true })
      signedIn = null

      await field().setValue('Bis Samstag um zehn')
      closeWindow()

      signedIn = 'me-id'
      openAgain()
      expect(field().element.value).toBe('')
    })

    /**
     * A session that ran out leaves the words on the device for the member to come back to
     * (Bernd's choice, 11.10.2026) -- as they stood when it ran out, not what the bar took in
     * afterwards with nobody signed in.
     */
    it('is there again after a session that ran out, as it stood when it ran out', async () => {
      mountBar()
      await field().setValue('Bis Samstag')
      await choose()
      forgetChatDrafts('me-id')
      signedIn = null

      await field().setValue('Bis Samstag um zehn')
      closeWindow()

      signedIn = 'me-id'
      openAgain()
      expect(field().element.value).toBe('Bis Samstag')
      // The picture waited in memory, and memory goes with every sign-out.
      expect(attached().exists()).toBe(false)
    })
  })
})
