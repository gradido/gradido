// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { setUserNoteMutation, userNoteQuery } from '@/graphql/userNotes.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { forgetUserNotes } from '@/utils/userNoteSaves'
import { NOTE_SAVE_PAUSE_MS, useChatWindowNote } from './useChatWindowNote'

const client = vi.hoisted(() => ({ query: vi.fn(), mutate: vi.fn() }))
const toastError = vi.hoisted(() => vi.fn())
vi.mock('@vue/apollo-composable', () => ({ useApolloClient: () => ({ client }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastError }) }))
vi.mock('@/store/useWalletStore', async () => {
  const { reactive } = await import('vue')
  const state = reactive({ gradidoID: 'me' })
  return { useWalletStore: () => state }
})

const ANNA = { member: { gradidoID: 'anna-id', communityUuid: 'home-uuid' } }
const BOB = { member: { gradidoID: 'bob-id', communityUuid: 'home-uuid' } }

/** A promise the test settles by hand. */
const deferred = () => {
  const handle = {}
  handle.promise = new Promise((resolve, reject) => {
    handle.resolve = resolve
    handle.reject = reject
  })
  return handle
}

const answers = (note) => ({ data: { userNote: note } })
const SAVED = { data: { setUserNote: true } }

const Host = defineComponent({
  props: { open: { type: Boolean, default: true }, about: { type: Object, default: null } },
  setup(props, { expose }) {
    expose(
      useChatWindowNote(
        () => props.open,
        () => props.about,
      ),
    )
    return () => h('div')
  },
})

const hosts = []
const mountHost = (props = {}) => {
  const host = mount(Host, { props: { open: true, about: ANNA, ...props } })
  hosts.push(host)
  return host
}
let wrapper
const mountMain = async (props = {}) => {
  wrapper = mountHost(props)
  await flushPromises()
  return wrapper
}
const note = () => wrapper.vm
const savesSent = () => client.mutate.mock.calls.map(([options]) => options.variables)

describe('useChatWindowNote', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    client.query.mockReset()
    client.mutate.mockReset()
    toastError.mockReset()
    client.query.mockResolvedValue(answers(null))
    client.mutate.mockResolvedValue(SAVED)
    useWalletStore().gradidoID = 'me'
    forgetUserNotes()
  })

  afterEach(() => {
    for (const host of hosts.splice(0)) host.unmount()
    vi.useRealTimers()
  })

  describe('when the window opens', () => {
    it('asks for the note of the person, and the button waits for the answer', async () => {
      const answer = deferred()
      client.query.mockReturnValueOnce(answer.promise)
      wrapper = mountHost()
      expect(client.query).toHaveBeenCalledWith({
        query: userNoteQuery,
        variables: { about: ANNA },
        fetchPolicy: 'no-cache',
      })
      expect(note().noteReady).toBe(false)
      answer.resolve(answers('Anna Sonnenberg'))
      await flushPromises()
      expect(note().noteReady).toBe(true)
      expect(note().noteText).toBe('Anna Sonnenberg')
      expect(note().hasNote).toBe(true)
      expect(note().noteStatus).toBe('')
    })

    it('knows a person without a note as one', async () => {
      await mountMain()
      expect(note().noteReady).toBe(true)
      expect(note().noteText).toBe('')
      expect(note().hasNote).toBe(false)
    })

    it('asks for nothing while the window is closed', async () => {
      await mountMain({ open: false })
      expect(client.query).not.toHaveBeenCalled()
      expect(note().noteReady).toBe(false)
    })

    it('asks anew each time it opens', async () => {
      await mountMain()
      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true })
      await flushPromises()
      expect(client.query).toHaveBeenCalledTimes(2)
    })
  })

  describe('saving', () => {
    it('saves a pause after the last key, and not before', async () => {
      await mountMain()
      note().typeNote('A')
      expect(note().noteStatus).toBe('saving')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS - 1)
      expect(client.mutate).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(client.mutate).toHaveBeenCalledWith({
        mutation: setUserNoteMutation,
        variables: { about: ANNA, note: 'A' },
      })
      await flushPromises()
      expect(note().noteStatus).toBe('saved')
    })

    it('starts the pause anew with every key', async () => {
      await mountMain()
      note().typeNote('A')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS - 400)
      note().typeNote('An')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS - 400)
      expect(client.mutate).not.toHaveBeenCalled()
      vi.advanceTimersByTime(400)
      expect(savesSent()).toEqual([{ about: ANNA, note: 'An' }])
    })

    it('saves at once when the note is closed', async () => {
      await mountMain()
      note().toggleNote()
      note().typeNote('Anna')
      note().closeNote()
      expect(savesSent()).toEqual([{ about: ANNA, note: 'Anna' }])
      expect(note().noteOpen).toBe(false)
    })

    it('saves at once when the window closes, for the person the words were typed for', async () => {
      await mountMain()
      note().typeNote('Anna')
      await wrapper.setProps({ open: false })
      expect(savesSent()).toEqual([{ about: ANNA, note: 'Anna' }])
    })

    it('saves for the person the words were typed for when the window turns to another', async () => {
      await mountMain()
      note().typeNote('on Anna')
      await wrapper.setProps({ about: BOB })
      expect(savesSent()).toEqual([{ about: ANNA, note: 'on Anna' }])
      expect(client.query).toHaveBeenLastCalledWith(
        expect.objectContaining({ variables: { about: BOB } }),
      )
      await flushPromises()
      expect(note().noteText).toBe('')
    })

    it('saves when the window goes away altogether', async () => {
      await mountMain()
      note().typeNote('Anna')
      wrapper.unmount()
      hosts.splice(hosts.indexOf(wrapper), 1)
      expect(savesSent()).toEqual([{ about: ANNA, note: 'Anna' }])
    })

    it('sends one save at a time, the latest words last', async () => {
      const first = deferred()
      client.mutate.mockReturnValueOnce(first.promise)
      await mountMain()
      note().typeNote('one')
      note().closeNote()
      note().toggleNote()
      note().typeNote('one two')
      note().closeNote()
      expect(savesSent()).toEqual([{ about: ANNA, note: 'one' }])
      first.resolve(SAVED)
      await flushPromises()
      expect(savesSent()).toEqual([
        { about: ANNA, note: 'one' },
        { about: ANNA, note: 'one two' },
      ])
    })

    // The contact window stands in six places: words saved in one must not be overtaken by older
    // words still waiting in another.
    it('sends the newest words last, whichever window they were typed in', async () => {
      const first = deferred()
      client.mutate.mockReturnValueOnce(first.promise)
      await mountMain()
      note().typeNote('one')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      note().typeNote('one two')
      await wrapper.setProps({ open: false })

      const other = mountHost()
      await flushPromises()
      expect(other.vm.noteText).toBe('one two')
      other.vm.typeNote('one two three')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)

      first.resolve(SAVED)
      await flushPromises()
      expect(savesSent()).toEqual([
        { about: ANNA, note: 'one' },
        { about: ANNA, note: 'one two three' },
      ])
      expect(other.vm.noteStatus).toBe('saved')
    })

    it('sends one save at a time over all notes, also of different people', async () => {
      const first = deferred()
      client.mutate.mockReturnValueOnce(first.promise)
      await mountMain()
      note().typeNote('on Anna')
      note().closeNote()
      const other = mountHost({ about: BOB })
      await flushPromises()
      other.vm.typeNote('on Bob')
      other.vm.closeNote()
      expect(savesSent()).toEqual([{ about: ANNA, note: 'on Anna' }])
      first.resolve(SAVED)
      await flushPromises()
      expect(savesSent()).toEqual([
        { about: ANNA, note: 'on Anna' },
        { about: BOB, note: 'on Bob' },
      ])
    })

    it('keeps saying "saving" while newer words than the confirmed ones stand in the field', async () => {
      const first = deferred()
      client.mutate.mockReturnValueOnce(first.promise)
      await mountMain()
      note().typeNote('one')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      note().typeNote('one two')
      first.resolve(SAVED)
      await flushPromises()
      expect(note().noteStatus).toBe('saving')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      await flushPromises()
      expect(note().noteStatus).toBe('saved')
    })
  })

  describe('answers that come late', () => {
    it('does not show the note of a person the window has left', async () => {
      const annasAnswer = deferred()
      client.query.mockReturnValueOnce(annasAnswer.promise)
      client.query.mockResolvedValueOnce(answers('on Bob'))
      wrapper = mountHost()
      await wrapper.setProps({ about: BOB })
      await flushPromises()
      annasAnswer.resolve(answers('on Anna'))
      await flushPromises()
      expect(note().noteText).toBe('on Bob')
    })

    it('shows the words of a note still being saved, not the older ones of the answer', async () => {
      client.mutate.mockReturnValueOnce(new Promise(() => {}))
      await mountMain()
      note().typeNote('words on their way')
      note().closeNote()
      client.query.mockResolvedValueOnce(answers('older words'))
      const other = mountHost()
      await flushPromises()
      expect(other.vm.noteText).toBe('words on their way')
      expect(other.vm.noteStatus).toBe('saving')
      expect(savesSent()).toHaveLength(1)
    })

    // The save is confirmed before the answer arrives -- but the answer was read before the save.
    it('takes the words of a save confirmed after the question left, not the older answer', async () => {
      const save = deferred()
      client.mutate.mockReturnValueOnce(save.promise)
      await mountMain()
      note().typeNote('new words')
      note().closeNote()
      const answer = deferred()
      client.query.mockReturnValueOnce(answer.promise)
      const other = mountHost()
      save.resolve(SAVED)
      await flushPromises()
      answer.resolve(answers('old words'))
      await flushPromises()
      expect(other.vm.noteText).toBe('new words')
    })

    it("sends no words of a member who signed out with the next member's session", async () => {
      await mountMain()
      note().typeNote('words of mine')
      useWalletStore().gradidoID = 'somebody-else'
      await flushPromises()
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      await flushPromises()
      expect(client.mutate).not.toHaveBeenCalled()
    })

    it('sends no words still waiting behind a save of the member who signed out', async () => {
      const first = deferred()
      client.mutate.mockReturnValueOnce(first.promise)
      await mountMain()
      note().typeNote('one')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      note().typeNote('one two')
      note().closeNote()
      forgetUserNotes()
      useWalletStore().gradidoID = 'somebody-else'
      first.resolve(SAVED)
      await flushPromises()
      expect(savesSent()).toEqual([{ about: ANNA, note: 'one' }])
    })

    it('tells the next member nothing of a save of the one before that fails late', async () => {
      const save = deferred()
      client.mutate.mockReturnValueOnce(save.promise)
      await mountMain()
      note().typeNote('words of mine')
      note().closeNote()
      forgetUserNotes()
      useWalletStore().gradidoID = 'somebody-else'
      save.reject(new Error('offline'))
      await flushPromises()
      expect(toastError).not.toHaveBeenCalled()
      expect(note().noteStatus).not.toBe('failed')
    })

    it('hands no words of the member before on to the next one at this browser', async () => {
      client.mutate.mockReturnValueOnce(new Promise(() => {}))
      await mountMain()
      note().typeNote('words of mine')
      await wrapper.setProps({ open: false })
      forgetUserNotes()
      useWalletStore().gradidoID = 'somebody-else'
      client.query.mockResolvedValueOnce(answers(null))
      await wrapper.setProps({ open: true })
      await flushPromises()
      expect(note().noteText).toBe('')
    })

    it('starts afresh when another member signs in while the window stands', async () => {
      await mountMain()
      useWalletStore().gradidoID = 'somebody-else'
      await flushPromises()
      expect(client.query).toHaveBeenCalledTimes(2)
    })
  })

  describe('failures', () => {
    // An empty field over a note the server holds would replace it.
    it('does not write over a note that could not be loaded, and loads it on "try again"', async () => {
      client.query.mockRejectedValueOnce(new Error('offline'))
      await mountMain()
      expect(note().noteStatus).toBe('loadFailed')
      expect(note().noteReady).toBe(true)
      note().typeNote('words')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      note().closeNote()
      expect(client.mutate).not.toHaveBeenCalled()

      client.query.mockResolvedValueOnce(answers('the note after all'))
      note().retryNote()
      await flushPromises()
      expect(note().noteText).toBe('the note after all')
      expect(note().noteStatus).toBe('')
    })

    it('does not take words while "try again" is loading the note', async () => {
      client.query.mockRejectedValueOnce(new Error('offline'))
      await mountMain()
      const answer = deferred()
      client.query.mockReturnValueOnce(answer.promise)
      note().retryNote()
      expect(note().noteStatus).toBe('loading')
      note().typeNote('typed into an empty field')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      expect(client.mutate).not.toHaveBeenCalled()
      answer.resolve(answers('the note the server holds'))
      await flushPromises()
      expect(note().noteText).toBe('the note the server holds')
    })

    it('says in the note when it could not be saved, and saves it on "try again"', async () => {
      client.mutate.mockRejectedValueOnce(new Error('offline'))
      await mountMain()
      note().toggleNote()
      note().typeNote('words')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      await flushPromises()
      expect(note().noteStatus).toBe('failed')
      expect(toastError).not.toHaveBeenCalled()
      note().retryNote()
      await flushPromises()
      expect(savesSent()).toEqual([
        { about: ANNA, note: 'words' },
        { about: ANNA, note: 'words' },
      ])
      expect(note().noteStatus).toBe('saved')
    })

    // Nobody looks at a closed note: a failure there would go unseen.
    it('says it in a toast when a note no window shows could not be saved', async () => {
      const save = deferred()
      client.mutate.mockReturnValueOnce(save.promise)
      await mountMain()
      note().toggleNote()
      note().typeNote('words')
      note().closeNote()
      save.reject(new Error('offline'))
      await flushPromises()
      expect(toastError).toHaveBeenCalledWith('chatNote.failedClosed')
    })

    it('says "saved" after "try again" in a note opened anew', async () => {
      client.mutate.mockRejectedValueOnce(new Error('offline'))
      await mountMain()
      note().toggleNote()
      note().typeNote('words')
      note().closeNote()
      await flushPromises()
      note().toggleNote()
      expect(note().noteStatus).toBe('failed')
      note().retryNote()
      await flushPromises()
      expect(note().noteStatus).toBe('saved')
    })

    it('shows the words that could not be saved when the note opens again', async () => {
      client.mutate.mockRejectedValueOnce(new Error('offline'))
      await mountMain()
      note().typeNote('words not saved')
      await wrapper.setProps({ open: false })
      await flushPromises()
      client.query.mockResolvedValueOnce(answers('older words'))
      await wrapper.setProps({ open: true })
      await flushPromises()
      expect(note().noteText).toBe('words not saved')
      expect(note().noteStatus).toBe('failed')
      expect(savesSent()).toHaveLength(1)
    })
  })
})
