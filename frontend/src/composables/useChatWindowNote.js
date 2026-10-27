// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { setUserNoteMutation, userNoteQuery } from '@/graphql/userNotes.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { confirmNote, keepUnconfirmedNote, unconfirmedNote } from '@/utils/unconfirmedNotes'

/** The pause after the last key after which a note is saved; closing it saves at once. */
export const NOTE_SAVE_PAUSE_MS = 1000

const keyOf = (about) => {
  if (about?.groupUuid) return `group:${about.groupUuid.toLowerCase()}`
  if (about?.member?.gradidoID) {
    const { communityUuid, gradidoID } = about.member
    return `member:${(communityUuid ?? '').toLowerCase()}/${gradidoID.toLowerCase()}`
  }
  return ''
}

/**
 * The member's own note on the person or group of a chat window (Bernd, 27.10.2026): the button
 * beside the magnifier lays it over the conversation, and only the member reads it.
 *
 * The note is asked for whenever the window opens on somebody; the button waits for the answer,
 * at the row's left end, where it moves nothing. What is typed is saved a pause after the last
 * key, and at once when the note, the window or the person changes -- one save at a time, the
 * latest words of each subject last, so an older answer cannot overwrite newer words.
 *
 * ⛔ A note that could not be loaded cannot be written: an empty field over a note the server
 * holds would replace it.
 *
 * @param isOpen getter: whether the window stands open -- a closed window knows nobody
 * @param aboutOf getter: what the note is about, `{ member: { gradidoID, communityUuid } }` or
 *   `{ groupUuid }`, or null where there is none
 */
export const useChatWindowNote = (isOpen, aboutOf) => {
  const { client } = useApolloClient()
  const store = useWalletStore()

  const noteOpen = ref(false)
  /** The note button, for the focus to go back to. */
  const noteToggle = ref(null)
  /** What stands in the field. */
  const noteText = ref('')
  /** '' | 'saving' | 'saved' | 'failed' | 'loadFailed' */
  const noteStatus = ref('')
  /** Whether the note of this subject has been asked for and answered (or failed). */
  const noteReady = ref(false)

  const hasNote = computed(() => noteText.value.trim() !== '')

  /** The subject the field stands for, with its owner. A new one for every opening. */
  let current = null
  let pauseTimer = 0
  /** Saves waiting to go out, by subject, the latest words of each. */
  const waiting = new Map()
  let sending = false

  const ownKey = (target) => `${target.owner}|${target.key}`

  const send = async ({ target, text }) => {
    // ⛔ Words of a member who is no longer the one signed in go nowhere: the request would carry
    // the next member's session, and the words would become a note of theirs.
    if (target.owner !== store.gradidoID) return
    try {
      await client.mutate({
        mutation: setUserNoteMutation,
        variables: { about: target.about, note: text },
      })
      confirmNote(ownKey(target), text)
      if (target === current && !waiting.has(target.key) && !pauseTimer) {
        noteStatus.value = noteText.value === text ? 'saved' : 'saving'
      }
    } catch {
      if (target === current && !waiting.has(target.key)) {
        noteStatus.value = 'failed'
      }
    }
  }

  const sendWaiting = async () => {
    if (sending) return
    sending = true
    while (waiting.size) {
      const [key, wish] = waiting.entries().next().value
      waiting.delete(key)
      await send(wish)
    }
    sending = false
  }

  const save = (target, text) => {
    // Kept before it goes out: a window opening on the same note meanwhile shows these words.
    keepUnconfirmedNote(ownKey(target), text)
    waiting.delete(target.key)
    waiting.set(target.key, { target, text })
    sendWaiting()
  }

  /** Words still waiting for their pause go now, to the subject they were typed for. */
  const flush = () => {
    if (!pauseTimer) return
    clearTimeout(pauseTimer)
    pauseTimer = 0
    if (current) save(current, noteText.value)
  }

  const load = async () => {
    const asked = current
    try {
      const { data } = await client.query({
        query: userNoteQuery,
        variables: { about: asked.about },
        fetchPolicy: 'no-cache',
      })
      if (asked !== current) return
      const kept = unconfirmedNote(ownKey(asked))
      if (kept !== undefined) {
        noteText.value = kept
        noteStatus.value = 'saving'
        save(asked, kept)
      } else {
        noteText.value = data?.userNote ?? ''
      }
    } catch {
      if (asked !== current) return
      noteStatus.value = 'loadFailed'
    }
    noteReady.value = true
  }

  const take = () => {
    const about = isOpen() ? aboutOf() : null
    const key = keyOf(about)
    const owner = store.gradidoID
    if (current && current.key === key && current.owner === owner) return
    flush()
    noteOpen.value = false
    noteText.value = ''
    noteStatus.value = ''
    noteReady.value = false
    current = key && owner ? { owner, key, about } : null
    if (current) load()
  }

  watch(() => [isOpen(), keyOf(aboutOf()), store.gradidoID], take, { immediate: true })

  /** The field's words, as the member types them. */
  const typeNote = (text) => {
    noteText.value = text
    if (!current || noteStatus.value === 'loadFailed') return
    noteStatus.value = 'saving'
    clearTimeout(pauseTimer)
    const target = current
    pauseTimer = setTimeout(() => {
      pauseTimer = 0
      save(target, noteText.value)
    }, NOTE_SAVE_PAUSE_MS)
  }

  /** "Try again": loads what could not be loaded, or saves what could not be saved. */
  const retryNote = () => {
    if (!current) return
    if (noteStatus.value === 'loadFailed') {
      noteStatus.value = ''
      noteReady.value = false
      load()
    } else if (noteStatus.value === 'failed') {
      noteStatus.value = 'saving'
      save(current, noteText.value)
    }
  }

  const closeNote = ({ focus = true } = {}) => {
    flush()
    noteOpen.value = false
    if (focus) nextTick(() => noteToggle.value?.focus())
  }

  const toggleNote = () => {
    if (noteOpen.value) {
      closeNote()
      return
    }
    if (noteStatus.value === 'saved') noteStatus.value = ''
    noteOpen.value = true
  }

  onBeforeUnmount(flush)

  return {
    noteOpen,
    noteText,
    noteStatus,
    noteReady,
    hasNote,
    noteToggle,
    typeNote,
    retryNote,
    toggleNote,
    closeNote,
  }
}
