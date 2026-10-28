// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { computed, onBeforeUnmount, type Ref, ref, shallowRef, watch } from 'vue'
import { setUserRemark } from '@/graphql/userRemark'
import { useAdminStore } from '@/store/useAdminStore'
import { moderatorKey } from '@/utils/theModerator'

/** The moderation's remark on a member, as the server answers it. */
export type UserRemark = {
  remark: string
  updatedAt: string
  updatedByName: string | null
}

/** What the field says about its words: being saved, saved, or not saved. Nothing while idle. */
export type RemarkStatus = 'idle' | 'saving' | 'saved' | 'failed'

/**
 * The pause after the last key at which the remark is saved -- as the wallet saves a member's own
 * note (frontend/src/composables/useChatWindowNote.js).
 */
export const REMARK_SAVE_PAUSE_MS = 1000

export type UserRemarkState = {
  // The first answer is there: until then nothing may be written, or an empty field over a remark
  // the server holds would replace it.
  loaded: Readonly<Ref<boolean>>
  // What the server holds, as last read or written; null where there is no remark.
  saved: Readonly<Ref<UserRemark | null>>
  // The words in the field.
  draft: Readonly<Ref<string>>
  // Whether this card's field is open.
  open: Readonly<Ref<boolean>>
  status: Readonly<Ref<RemarkStatus>>
  // The answer of the card's question, for the member it was asked about.
  take: (userId: number, remark: UserRemark | null) => void
  input: (text: string) => void
  toggle: () => void
  close: () => void
  retry: () => void
  // Saves now what waits for its pause, and answers once the server holds the words in the field
  // -- or has refused them. Crea reads the remark from the server (Bernd, 28.10.2026).
  flush: () => Promise<void>
}

type Client = {
  mutate: (options: {
    mutation: unknown
    variables: { userId: number; remark: string }
  }) => Promise<{ data?: { setUserRemark?: UserRemark | null } | null }>
}

/**
 * What the admin interface holds of one member's remark, for the signed-in moderator: one for
 * every card that shows the member. Only one contribution is open at a time, but opening the next
 * one closes the last in the same moment -- and the next one of the same member then shows the
 * words just typed, saved or on their way, and not the remark the server held before them. Kept
 * while a card shows the member, while words wait for their pause or their save, and while words
 * whose save failed wait to be saved again (the next card of the member shows them, "Nicht
 * gespeichert"). Then it goes, and the next card reads the remark anew.
 *
 * Like the wallet's saves of a member's own note (frontend/src/utils/userNoteSaves.js), which keep
 * them in one module for the same reason.
 */
type Entry = {
  userId: number
  loaded: Ref<boolean>
  saved: Ref<UserRemark | null>
  draft: Ref<string>
  status: Ref<RemarkStatus>
  cards: number
  // The cards whose field is open: a failure there is seen, anywhere else it is told in a toast.
  openIn: Set<symbol>
  pause: ReturnType<typeof setTimeout> | null
  saving: Promise<void> | null
  saveAgain: boolean
  // The latest card's: who is told of a failure nobody sees, and how the server is reached.
  onFailedUnseen: () => void
  client: () => Client | null
}

const entries = new Map<string, Entry>()

/** For the specs: every member forgotten, every pause stopped. */
export const forgetUserRemarks = (): void => {
  for (const entry of entries.values()) {
    if (entry.pause) {
      clearTimeout(entry.pause)
    }
  }
  entries.clear()
}

// What the server would keep of these words: whitespace alone takes the remark away.
const asKept = (text: string) => (text.trim() === '' ? '' : text)
const unchanged = (entry: Entry) => asKept(entry.draft.value) === (entry.saved.value?.remark ?? '')

const forgetIfDone = (key: string, entry: Entry) => {
  if (
    entries.get(key) === entry &&
    entry.cards === 0 &&
    !entry.pause &&
    !entry.saving &&
    entry.status.value !== 'failed'
  ) {
    entries.delete(key)
  }
}

const stopPause = (entry: Entry) => {
  if (entry.pause) {
    clearTimeout(entry.pause)
    entry.pause = null
  }
}

/** Saves the words of the entry, one save after the other; the words typed meanwhile go next. */
const save = (key: string, entry: Entry): Promise<void> => {
  stopPause(entry)
  if (entry.saving) {
    entry.saveAgain = true
    return entry.saving
  }
  if (!entry.loaded.value || unchanged(entry)) {
    if (entry.status.value === 'failed' && unchanged(entry)) {
      entry.status.value = 'idle'
    }
    forgetIfDone(key, entry)
    return Promise.resolve()
  }
  const remark = entry.draft.value
  entry.status.value = 'saving'
  entry.saving = (async () => {
    // ⛔ Yield once before anything can fail: an async function runs up to its first `await` at
    // once, and a failure there ran `finally` before `entry.saving` held this promise -- the lock
    // stayed, and nothing was ever sent again (coderabbit, #4220).
    await Promise.resolve()
    try {
      const client = entry.client()
      if (!client) {
        throw new Error('no client')
      }
      const { data } = await client.mutate({
        mutation: setUserRemark,
        variables: { userId: entry.userId, remark },
      })
      const answer = data?.setUserRemark ?? null
      entry.saved.value = answer
      // Words of whitespace come back as no remark, and the field holds nothing then either --
      // unless the moderator typed on meanwhile.
      if (entry.draft.value === remark) {
        entry.draft.value = answer?.remark ?? ''
      }
      entry.status.value = 'saved'
    } catch {
      entry.status.value = 'failed'
      if (entry.openIn.size === 0) {
        entry.onFailedUnseen()
      }
    } finally {
      entry.saving = null
    }
    if (entry.saveAgain) {
      entry.saveAgain = false
      await save(key, entry)
    }
    forgetIfDone(key, entry)
  })()
  return entry.saving
}

/**
 * The moderation's remark on the member of an opened contribution (Bernd, 28.10.2026): read with
 * the messages of the contribution (`take`, the first answer only -- a later one, after a message
 * was sent, must not replace words that wait to be saved), written while the moderator types:
 * after a pause of REMARK_SAVE_PAUSE_MS, when the field is closed, and when the card goes away.
 *
 * `onFailedUnseen` is called where a save fails that nobody sees fail: no card of the member has
 * its field open.
 *
 * `userId` may answer null: a card that shows nobody now -- Crea's window while it is closed --
 * holds nothing, and what it held is let go as when a card goes away.
 */
export const useUserRemark = (
  userId: () => number | null,
  onFailedUnseen: () => void,
): UserRemarkState => {
  const store = useAdminStore()
  // Resolved at the save: where a spec mocks the composable away it answers undefined, and
  // taking that apart at setup would throw (MemberWalletLink has the same line for the same
  // reason).
  const apollo = useApolloClient()
  const card = Symbol('card')
  const open = ref(false)

  // Per moderator: a browser is used by more than one, and words one of them typed and could not
  // save are not shown to the next (useAdminStore).
  const keyOf = (id: number) => `${moderatorKey(store.moderator) ?? ''}/${id}`

  const attach = (id: number) => {
    const key = keyOf(id)
    let entry = entries.get(key)
    if (!entry) {
      entry = {
        userId: id,
        loaded: ref(false),
        saved: shallowRef(null),
        draft: ref(''),
        status: ref('idle'),
        cards: 0,
        openIn: new Set(),
        pause: null,
        saving: null,
        saveAgain: false,
        onFailedUnseen,
        client: () => null,
      }
      entries.set(key, entry)
    }
    entry.cards += 1
    entry.onFailedUnseen = onFailedUnseen
    entry.client = () => {
      try {
        return (apollo.resolveClient() as unknown as Client) ?? null
      } catch {
        return null
      }
    }
    return { key, entry }
  }

  // The card lets the member go: what is not saved yet goes now.
  const detach = ({ key, entry }: { key: string; entry: Entry }) => {
    entry.cards -= 1
    entry.openIn.delete(card)
    if (entry.pause || (entry.loaded.value && !unchanged(entry))) {
      save(key, entry)
    } else {
      forgetIfDone(key, entry)
    }
  }

  const attachOrNot = (id: number | null) => (id === null ? null : attach(id))
  const current = shallowRef(attachOrNot(userId()))
  // A card that comes to show somebody else -- or nobody -- lets the first one go.
  watch(userId, (id) => {
    const before = current.value
    open.value = false
    current.value = attachOrNot(id)
    if (before) {
      detach(before)
    }
  })
  onBeforeUnmount(() => {
    if (current.value) {
      detach(current.value)
    }
  })

  const take = (forMember: number, remark: UserRemark | null) => {
    const entry = entries.get(keyOf(forMember))
    if (!entry || entry.loaded.value) {
      return
    }
    entry.loaded.value = true
    entry.saved.value = remark
    entry.draft.value = remark?.remark ?? ''
  }

  const input = (text: string) => {
    if (!current.value) {
      return
    }
    const { key, entry } = current.value
    entry.draft.value = text
    stopPause(entry)
    entry.pause = setTimeout(() => {
      entry.pause = null
      save(key, entry)
    }, REMARK_SAVE_PAUSE_MS)
  }

  const close = () => {
    open.value = false
    if (!current.value) {
      return
    }
    const { key, entry } = current.value
    entry.openIn.delete(card)
    save(key, entry)
  }

  const toggle = () => {
    if (open.value) {
      close()
      return
    }
    const entry = current.value?.entry
    if (!entry?.loaded.value) {
      return
    }
    open.value = true
    entry.openIn.add(card)
  }

  const retry = () => {
    if (current.value) {
      save(current.value.key, current.value.entry)
    }
  }

  const flush = () =>
    current.value ? save(current.value.key, current.value.entry) : Promise.resolve()

  return {
    loaded: computed(() => current.value?.entry.loaded.value ?? false),
    saved: computed(() => current.value?.entry.saved.value ?? null),
    draft: computed(() => current.value?.entry.draft.value ?? ''),
    open,
    status: computed(() => current.value?.entry.status.value ?? 'idle'),
    take,
    input,
    toggle,
    close,
    retry,
    flush,
  }
}
