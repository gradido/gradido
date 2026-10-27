// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { setUserNoteMutation, userNoteQuery } from '@/graphql/userNotes.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { forgetUserNotes } from '@/utils/unconfirmedNotes'
import { NOTE_SAVE_PAUSE_MS, useChatWindowNote } from './useChatWindowNote'

const client = vi.hoisted(() => ({ query: vi.fn(), mutate: vi.fn() }))
vi.mock('@vue/apollo-composable', () => ({ useApolloClient: () => ({ client }) }))
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

let wrapper
const mountHost = async (props = {}) => {
  wrapper = mount(Host, { props: { open: true, about: ANNA, ...props } })
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
    client.query.mockResolvedValue(answers(null))
    client.mutate.mockResolvedValue({ data: { setUserNote: true } })
    useWalletStore().gradidoID = 'me'
    forgetUserNotes()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  describe('when the window opens', () => {
    it('asks for the note of the person, and the button waits for the answer', async () => {
      const answer = deferred()
      client.query.mockReturnValueOnce(answer.promise)
      wrapper = mount(Host, { props: { open: true, about: ANNA } })
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
    })

    it('knows a person without a note as one', async () => {
      await mountHost()
      expect(note().noteReady).toBe(true)
      expect(note().noteText).toBe('')
      expect(note().hasNote).toBe(false)
    })

    it('asks for nothing while the window is closed', async () => {
      await mountHost({ open: false })
      expect(client.query).not.toHaveBeenCalled()
      expect(note().noteReady).toBe(false)
    })

    it('asks anew each time it opens', async () => {
      await mountHost()
      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true })
      await flushPromises()
      expect(client.query).toHaveBeenCalledTimes(2)
    })
  })

  describe('saving', () => {
    it('saves a pause after the last key, and not before', async () => {
      await mountHost()
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
      await mountHost()
      note().typeNote('A')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS - 400)
      note().typeNote('An')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS - 400)
      expect(client.mutate).not.toHaveBeenCalled()
      vi.advanceTimersByTime(400)
      expect(savesSent()).toEqual([{ about: ANNA, note: 'An' }])
    })

    it('saves at once when the note is closed', async () => {
      await mountHost()
      note().toggleNote()
      note().typeNote('Anna')
      note().closeNote()
      expect(savesSent()).toEqual([{ about: ANNA, note: 'Anna' }])
      expect(note().noteOpen).toBe(false)
    })

    it('saves at once when the window closes, for the person the words were typed for', async () => {
      await mountHost()
      note().typeNote('Anna')
      await wrapper.setProps({ open: false })
      expect(savesSent()).toEqual([{ about: ANNA, note: 'Anna' }])
    })

    it('saves for the person the words were typed for when the window turns to another', async () => {
      await mountHost()
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
      await mountHost()
      note().typeNote('Anna')
      wrapper.unmount()
      expect(savesSent()).toEqual([{ about: ANNA, note: 'Anna' }])
    })

    it('sends one save at a time, the latest words last', async () => {
      const first = deferred()
      client.mutate.mockReturnValueOnce(first.promise)
      await mountHost()
      note().typeNote('one')
      note().closeNote()
      note().toggleNote()
      note().typeNote('one two')
      note().closeNote()
      expect(savesSent()).toEqual([{ about: ANNA, note: 'one' }])
      first.resolve({ data: { setUserNote: true } })
      await flushPromises()
      expect(savesSent()).toEqual([
        { about: ANNA, note: 'one' },
        { about: ANNA, note: 'one two' },
      ])
    })

    it('keeps saying "saving" while newer words than the confirmed ones stand in the field', async () => {
      const first = deferred()
      client.mutate.mockReturnValueOnce(first.promise)
      await mountHost()
      note().typeNote('one')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      note().typeNote('one two')
      first.resolve({ data: { setUserNote: true } })
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
      wrapper = mount(Host, { props: { open: true, about: ANNA } })
      await wrapper.setProps({ about: BOB })
      await flushPromises()
      annasAnswer.resolve(answers('on Anna'))
      await flushPromises()
      expect(note().noteText).toBe('on Bob')
    })

    it('shows words the server has not confirmed yet, and sends them once more', async () => {
      const first = deferred()
      client.mutate.mockReturnValueOnce(first.promise)
      await mountHost()
      note().typeNote('newer words')
      await wrapper.setProps({ open: false })
      client.query.mockResolvedValueOnce(answers('older words'))
      await wrapper.setProps({ open: true })
      await flushPromises()
      expect(note().noteText).toBe('newer words')
      expect(note().noteStatus).toBe('saving')
      // One save at a time: the second goes out when the first has its answer.
      expect(savesSent()).toEqual([{ about: ANNA, note: 'newer words' }])
      first.resolve({ data: { setUserNote: true } })
      await flushPromises()
      expect(savesSent()).toEqual([
        { about: ANNA, note: 'newer words' },
        { about: ANNA, note: 'newer words' },
      ])
      expect(note().noteStatus).toBe('saved')
    })

    it('shows the words of a note another window is still saving', async () => {
      client.mutate.mockReturnValueOnce(new Promise(() => {}))
      await mountHost()
      note().typeNote('words on their way')
      note().closeNote()
      client.query.mockResolvedValueOnce(answers('older words'))
      const second = mount(Host, { props: { open: true, about: ANNA } })
      try {
        await flushPromises()
        expect(second.vm.noteText).toBe('words on their way')
        expect(client.mutate.mock.calls.at(-1)[0].variables).toEqual({
          about: ANNA,
          note: 'words on their way',
        })
      } finally {
        second.unmount()
      }
    })

    it('hands no words of the member before on to the next one at this browser', async () => {
      client.mutate.mockReturnValueOnce(new Promise(() => {}))
      await mountHost()
      note().typeNote('words of mine')
      await wrapper.setProps({ open: false })
      forgetUserNotes()
      useWalletStore().gradidoID = 'somebody-else'
      client.query.mockResolvedValueOnce(answers(null))
      await wrapper.setProps({ open: true })
      await flushPromises()
      expect(note().noteText).toBe('')
    })

    it("sends no words of a member who signed out with the next member's session", async () => {
      await mountHost()
      note().typeNote('words of mine')
      useWalletStore().gradidoID = 'somebody-else'
      await flushPromises()
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      await flushPromises()
      expect(client.mutate).not.toHaveBeenCalled()
    })

    it('starts afresh when another member signs in while the window stands', async () => {
      await mountHost()
      useWalletStore().gradidoID = 'somebody-else'
      await flushPromises()
      expect(client.query).toHaveBeenCalledTimes(2)
    })
  })

  describe('failures', () => {
    // An empty field over a note the server holds would replace it.
    it('does not write over a note that could not be loaded, and loads it on "try again"', async () => {
      client.query.mockRejectedValueOnce(new Error('offline'))
      await mountHost()
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

    it('says when a note could not be saved, and saves it on "try again"', async () => {
      client.mutate.mockRejectedValueOnce(new Error('offline'))
      await mountHost()
      note().typeNote('words')
      vi.advanceTimersByTime(NOTE_SAVE_PAUSE_MS)
      await flushPromises()
      expect(note().noteStatus).toBe('failed')
      note().retryNote()
      await flushPromises()
      expect(savesSent()).toEqual([
        { about: ANNA, note: 'words' },
        { about: ANNA, note: 'words' },
      ])
      expect(note().noteStatus).toBe('saved')
    })
  })
})
