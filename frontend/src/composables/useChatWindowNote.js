// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { userNoteQuery } from '@/graphql/userNotes.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { noteConfirmationOf, noteSaveOf, saveNote } from '@/utils/userNoteSaves'

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

/** Notes open in a window right now, by key: a save that fails there says so in the window. */
const openNotes = new Map()

/**
 * The member's own note on the person or group of a chat window (Bernd, 27.10.2026): the button
 * beside the magnifier lays it over the conversation, and only the member reads it.
 *
 * The note is asked for whenever the window opens on somebody; the button waits for the answer,
 * at the row's left end, where it moves nothing. What is typed is saved a pause after the last
 * key, and at once when the note, the window or the person changes. The saving itself is one for
 * every window of the page (utils/userNoteSaves): one save at a time, the latest words last.
 *
 * ⛔ A note that is not loaded cannot be written -- while it loads, and where loading failed: an
 * empty field over a note the server holds would replace it.
 *
 * @param isOpen getter: whether the window stands open -- a closed window knows nobody
 * @param aboutOf getter: what the note is about, `{ member: { gradidoID, communityUuid } }` or
 *   `{ groupUuid }`, or null where there is none
 */
export const useChatWindowNote = (isOpen, aboutOf) => {
  const { client } = useApolloClient()
  const store = useWalletStore()
  const { t } = useI18n()
  const { toastError } = useAppToast()

  const noteOpen = ref(false)
  /** The note button, for the focus to go back to. */
  const noteToggle = ref(null)
  /** What stands in the field. */
  const noteText = ref('')
  /** Whether the note of this subject has been asked for and answered (or failed). */
  const noteReady = ref(false)
  /** '' | 'loading' | 'loadFailed' */
  const loadState = ref('')
  /** Whether a pause after the last key is running. */
  const pausing = ref(false)
  /** Whether the member typed in this opening: "saved" is said only to who saved something. */
  const touched = ref(false)

  /** The subject the field stands for, with its owner. A new one for every opening. */
  const current = ref(null)
  let pauseTimer = 0

  /** '' | 'loading' | 'loadFailed' | 'saving' | 'saved' | 'failed' */
  const noteStatus = computed(() => {
    if (loadState.value) return loadState.value
    if (pausing.value) return 'saving'
    const save = current.value ? noteSaveOf(current.value.ownKey) : null
    if (!save) return ''
    if (save.state === 'waiting' || save.state === 'sending') return 'saving'
    if (save.state === 'failed') return 'failed'
    return touched.value && save.words === noteText.value ? 'saved' : ''
  })

  const hasNote = computed(() => noteText.value.trim() !== '')

  /** Told by the saving when a save failed: a note no window shows says so in a toast. */
  const sayNotSaved = (key) => {
    if (!openNotes.get(key)) toastError(t('chatNote.failedClosed'))
  }

  const send = (target, words) =>
    saveNote({
      key: target.ownKey,
      owner: target.owner,
      about: target.about,
      words,
      client,
      ownerNow: () => store.gradidoID,
      onFailure: sayNotSaved,
    })

  /** Words still waiting for their pause go now, to the subject they were typed for. */
  const flush = () => {
    if (!pauseTimer) return
    clearTimeout(pauseTimer)
    pauseTimer = 0
    pausing.value = false
    if (current.value) send(current.value, noteText.value)
  }

  const load = async () => {
    const asked = current.value
    const confirmedBefore = noteConfirmationOf(asked.ownKey).at
    loadState.value = 'loading'
    let answer
    try {
      const { data } = await client.query({
        query: userNoteQuery,
        variables: { about: asked.about },
        fetchPolicy: 'no-cache',
      })
      answer = data?.userNote ?? ''
    } catch {
      if (asked !== current.value) return
      loadState.value = 'loadFailed'
      noteReady.value = true
      return
    }
    if (asked !== current.value) return
    const save = noteSaveOf(asked.ownKey)
    const confirmation = noteConfirmationOf(asked.ownKey)
    if (save && save.state !== 'saved') {
      // Words of this tab the server has not confirmed: on their way, or not saved.
      noteText.value = save.words
    } else if (confirmation.at !== confirmedBefore) {
      // A save was confirmed after the question left: its words are newer than the answer.
      noteText.value = confirmation.text
    } else {
      noteText.value = answer
    }
    loadState.value = ''
    noteReady.value = true
  }

  const take = () => {
    const about = isOpen() ? aboutOf() : null
    const key = keyOf(about)
    const owner = store.gradidoID
    if (current.value && current.value.key === key && current.value.owner === owner) return
    flush()
    noteOpen.value = false
    noteText.value = ''
    loadState.value = ''
    noteReady.value = false
    touched.value = false
    current.value = key && owner ? { owner, key, ownKey: `${owner}|${key}`, about } : null
    if (current.value) load()
  }

  watch(() => [isOpen(), keyOf(aboutOf()), store.gradidoID], take, { immediate: true })

  // Which notes are open in a window, for the saving to know where a failure is seen.
  let shown = null
  const show = (key) => {
    if (shown) openNotes.set(shown, (openNotes.get(shown) ?? 1) - 1)
    shown = key
    if (shown) openNotes.set(shown, (openNotes.get(shown) ?? 0) + 1)
  }
  watch(
    () => (noteOpen.value && current.value ? current.value.ownKey : null),
    (key) => show(key),
  )

  /** The field's words, as the member types them. */
  const typeNote = (text) => {
    noteText.value = text
    if (!current.value || loadState.value) return
    touched.value = true
    pausing.value = true
    clearTimeout(pauseTimer)
    const target = current.value
    pauseTimer = setTimeout(() => {
      pauseTimer = 0
      pausing.value = false
      send(target, noteText.value)
    }, NOTE_SAVE_PAUSE_MS)
  }

  /** "Try again": loads what could not be loaded, or saves what could not be saved. */
  const retryNote = () => {
    if (!current.value) return
    if (loadState.value === 'loadFailed') {
      load()
    } else if (noteStatus.value === 'failed') {
      // The member saved by hand: "saved" is said to them.
      touched.value = true
      send(current.value, noteText.value)
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
    touched.value = false
    noteOpen.value = true
  }

  onBeforeUnmount(() => {
    flush()
    show(null)
  })

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
