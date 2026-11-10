// AI-GENERATED — not an architecture reference
import { setUserRemark } from '@admin/graphql/userRemark'
import m from 'mithril'
import * as v from 'valibot'
import { type UserRemark, userRemarkSchema } from '@/data/Contribution.schema'
import { moderatorKey } from '@/data/Member.logic'
import { asKept } from '@/data/UserRemark.logic'
import { graphqlRequest } from '@/graphql/client'
import { adminStore } from './admin.store'

/** The pause after the last key at which the remark is saved, as the wallet saves a note. */
export const REMARK_SAVE_PAUSE_MS = 1000

export type RemarkStatus = 'idle' | 'saving' | 'saved' | 'failed'

/** What this device holds of one member's remark, for the moderator signed in. */
type Entry = {
  userId: number
  // the first answer is there: until then nothing is written, or an empty field would replace it
  loaded: boolean
  // what the server holds, as last read or written
  saved: UserRemark | null
  draft: string
  status: RemarkStatus
  // the cards that show the member, and those of them whose field is open
  cards: number
  openIn: Set<RemarkCard>
  pause: ReturnType<typeof setTimeout> | null
  saving: Promise<void> | null
  saveAgain: boolean
  // the latest card's: who is told of a failure nobody sees
  onFailedUnseen: () => void
}

/** A card that shows a member's remark: an opened contribution. */
export type RemarkCard = { key: string; entry: Entry; open: boolean }

/**
 * Kept while a card shows the member, while words wait for their pause or their save, and while
 * words whose save failed wait to be saved again: opening the next contribution of the member
 * closes the last in the same moment, and the next card shows the words just typed. Then the
 * entry goes, and the next card reads the remark anew. Per moderator: one browser serves several.
 */
const entries = new Map<string, Entry>()

const unchanged = (entry: Entry) => asKept(entry.draft) === (entry.saved?.remark ?? '')

const forgetIfDone = (key: string, entry: Entry) => {
  if (
    entries.get(key) === entry &&
    entry.cards === 0 &&
    !entry.pause &&
    !entry.saving &&
    entry.status !== 'failed'
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

/** Saves the entry's words, one save after the other; words typed meanwhile go next. */
const save = (key: string, entry: Entry): Promise<void> => {
  stopPause(entry)
  if (entry.saving) {
    entry.saveAgain = true
    return entry.saving
  }
  if (!entry.loaded || unchanged(entry)) {
    if (entry.status === 'failed' && unchanged(entry)) {
      entry.status = 'idle'
    }
    forgetIfDone(key, entry)
    return Promise.resolve()
  }
  const remark = entry.draft
  entry.status = 'saving'
  m.redraw()
  entry.saving = (async () => {
    const answer = await graphqlRequest(setUserRemark, { userId: entry.userId, remark })
    entry.saving = null
    if (answer.success) {
      entry.saved = v.parse(
        v.object({ setUserRemark: v.nullable(userRemarkSchema) }),
        answer.value,
      ).setUserRemark
      // whitespace comes back as no remark -- unless the moderator typed on meanwhile
      if (entry.draft === remark) {
        entry.draft = entry.saved?.remark ?? ''
      }
      entry.status = 'saved'
    } else {
      entry.status = 'failed'
      if (entry.openIn.size === 0) {
        entry.onFailedUnseen()
      }
    }
    if (entry.saveAgain) {
      entry.saveAgain = false
      await save(key, entry)
    }
    forgetIfDone(key, entry)
  })()
  return entry.saving
}

/** A card comes to show the remark on member `userId`. */
export const attachRemark = (userId: number, onFailedUnseen: () => void): RemarkCard => {
  const key = `${moderatorKey(adminStore.moderator) ?? ''}/${userId}`
  const entry: Entry = entries.get(key) ?? {
    userId,
    loaded: false,
    saved: null,
    draft: '',
    status: 'idle',
    cards: 0,
    openIn: new Set(),
    pause: null,
    saving: null,
    saveAgain: false,
    onFailedUnseen,
  }
  entries.set(key, entry)
  entry.cards += 1
  entry.onFailedUnseen = onFailedUnseen
  return { key, entry, open: false }
}

/** The card goes: what is not saved yet goes now. */
export const detachRemark = (card: RemarkCard) => {
  const { key, entry } = card
  entry.cards -= 1
  entry.openIn.delete(card)
  if (entry.pause || (entry.loaded && !unchanged(entry))) {
    save(key, entry)
  } else {
    forgetIfDone(key, entry)
  }
}

/** The remark as the card's first answer read it; a later answer must not replace waiting words. */
export const takeRemark = ({ entry }: RemarkCard, remark: UserRemark | null) => {
  if (entry.loaded) {
    return
  }
  entry.loaded = true
  entry.saved = remark
  entry.draft = remark?.remark ?? ''
}

/** Words typed: saved after a pause. */
export const typeRemark = ({ key, entry }: RemarkCard, text: string) => {
  entry.draft = text
  stopPause(entry)
  entry.pause = setTimeout(() => {
    entry.pause = null
    save(key, entry)
  }, REMARK_SAVE_PAUSE_MS)
}

/** Opens the card's field, once the remark is read. */
export const openRemark = (card: RemarkCard) => {
  if (card.entry.loaded) {
    card.open = true
    card.entry.openIn.add(card)
  }
}

/** Closes the card's field and saves what waits. */
export const closeRemark = (card: RemarkCard) => {
  card.open = false
  card.entry.openIn.delete(card)
  save(card.key, card.entry)
}

/** Saves again what failed. */
export const retryRemark = ({ key, entry }: RemarkCard) => save(key, entry)

/**
 * Saves now what waits for its pause, and answers once the server holds the words in the field --
 * or has refused them: Crea reads the remark from the server.
 */
export const flushRemark = ({ key, entry }: RemarkCard) => save(key, entry)
