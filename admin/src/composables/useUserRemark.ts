// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { onBeforeUnmount, type Ref, ref } from 'vue'
import { setUserRemark } from '@/graphql/userRemark'

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
  loaded: Ref<boolean>
  // What the server holds, as last read or written; null where there is no remark.
  saved: Ref<UserRemark | null>
  // The words in the field.
  draft: Ref<string>
  open: Ref<boolean>
  status: Ref<RemarkStatus>
  take: (remark: UserRemark | null) => void
  input: (text: string) => void
  toggle: () => void
  close: () => void
  retry: () => void
}

/**
 * The moderation's remark on the member of an opened contribution (Bernd, 28.10.2026): read with
 * the messages of the contribution (`take`), written while the moderator types -- after a pause of
 * REMARK_SAVE_PAUSE_MS, and when the field is closed or the contribution's card goes away --, one
 * save after the other.
 *
 * `onFailedUnseen` is called where a save fails that nobody sees fail: the field was closed, or
 * the card is gone.
 */
export const useUserRemark = (
  userId: () => number,
  onFailedUnseen: () => void,
): UserRemarkState => {
  // Resolved at the save: where a spec mocks the composable away it answers undefined, and
  // taking that apart at setup would throw (MemberWalletLink has the same line for the same
  // reason).
  const apollo = useApolloClient()

  const loaded = ref(false)
  const saved = ref<UserRemark | null>(null)
  const draft = ref('')
  const open = ref(false)
  const status = ref<RemarkStatus>('idle')

  let pause: ReturnType<typeof setTimeout> | null = null
  let saving: Promise<void> | null = null
  let saveAgain = false
  let gone = false

  // What the server would keep of these words: whitespace alone takes the remark away.
  const asKept = (text: string) => (text.trim() === '' ? '' : text)
  const unchanged = () => asKept(draft.value) === (saved.value?.remark ?? '')

  const stopPause = () => {
    if (pause) {
      clearTimeout(pause)
      pause = null
    }
  }

  const take = (remark: UserRemark | null) => {
    // Words the moderator changed stay in an open field; a closed field, or one they have not
    // touched, shows what the server holds -- a colleague may have written meanwhile, and saving
    // the old words unchanged would take theirs away.
    const untouched = unchanged() && !pause
    loaded.value = true
    saved.value = remark
    if (!open.value || untouched) {
      draft.value = remark?.remark ?? ''
    }
  }

  const save = (): Promise<void> => {
    stopPause()
    if (saving) {
      // One save at a time: the words typed meanwhile go with the next one.
      saveAgain = true
      return saving
    }
    if (!loaded.value || unchanged()) {
      if (status.value === 'failed' && unchanged()) {
        status.value = 'idle'
      }
      return Promise.resolve()
    }
    const forMember = userId()
    const remark = draft.value
    status.value = 'saving'
    saving = (async () => {
      try {
        const { data } = await apollo.resolveClient().mutate({
          mutation: setUserRemark,
          variables: { userId: forMember, remark },
        })
        // ⛔ Only for the member it was written for: the card may show somebody else by now.
        if (forMember !== userId()) {
          return
        }
        saved.value = data?.setUserRemark ?? null
        status.value = 'saved'
      } catch {
        if (forMember !== userId()) {
          return
        }
        status.value = 'failed'
        if (gone || !open.value) {
          onFailedUnseen()
        }
      } finally {
        saving = null
      }
      if (saveAgain) {
        saveAgain = false
        await save()
      }
    })()
    return saving
  }

  const input = (text: string) => {
    draft.value = text
    stopPause()
    pause = setTimeout(() => {
      pause = null
      save()
    }, REMARK_SAVE_PAUSE_MS)
  }

  const close = () => {
    open.value = false
    save()
  }

  const toggle = () => {
    if (open.value) {
      close()
      return
    }
    if (!loaded.value) {
      return
    }
    // Words that were not saved stay in the field, to be saved again; otherwise it opens with
    // what the server holds.
    if (status.value !== 'failed' && !pause && !saving) {
      draft.value = saved.value?.remark ?? ''
    }
    open.value = true
  }

  const retry = () => {
    save()
  }

  // The card goes away -- the contribution is closed, confirmed, the page left: what is not saved
  // yet goes now.
  onBeforeUnmount(() => {
    gone = true
    if (pause || (loaded.value && !unchanged())) {
      save()
    }
  })

  return { loaded, saved, draft, open, status, take, input, toggle, close, retry }
}
