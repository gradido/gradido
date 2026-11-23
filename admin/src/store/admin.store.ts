// AI-GENERATED — not an architecture reference

import m from 'mithril'
import * as v from 'valibot'
import { CONFIG } from '@/config'
import {
  type HandledCreationGroups,
  type KeptHandledCreationGroups,
  keptHandledCreationGroupsField,
} from '@/data/CreationGroup.schema'
import { type Moderator, moderatorSchema } from '@/data/Moderator.schema'
import { followAuthToken, keepAuthToken, readAuthToken, tokenBelongsTo } from '@/utils/authToken'
import { forgetMemberAvatars } from './memberAvatars.store'
import { closeMemberAvatarZoom } from './memberAvatarZoom.store'
import { forgetModeratorContacts } from './moderatorContacts.store'

/**
 * The state of the admin interface: whom it is signed in as, and how many creations and support
 * requests are open. A plain object: Mithril redraws after every event handler and every
 * m.request, so nothing has to be told of a change. Only what changes outside of Mithril (another
 * window) calls m.redraw.
 */
type AdminState = {
  token: string | null
  moderator: Moderator | null
  openCreations: number
  openSupportTickets: number
  // "Meine Gruppen" as the server last answered it, and for whom: read only where it is the
  // signed-in moderator's (chosenGroupsOf). The column "Schöpfung" (MG1), the column "Support" (MG2b).
  handledCreationGroups: KeptHandledCreationGroups | null
  handledSupportGroups: KeptHandledCreationGroups | null
}

/** Where the admin keeps its own state in localStorage; the key of the old admin, kept. */
const STATE_KEY = 'gradido-admin'

const savedStateSchema = v.object({
  moderator: v.optional(v.nullable(moderatorSchema), null),
  openCreations: v.optional(v.number(), 0),
  openSupportTickets: v.optional(v.number(), 0),
  handledCreationGroups: keptHandledCreationGroupsField,
  handledSupportGroups: keptHandledCreationGroupsField,
})

/** What the blob holds of the state, or the empty state where it cannot be read. */
const savedState = () => {
  try {
    const parsed = v.safeParse(
      savedStateSchema,
      JSON.parse(localStorage.getItem(STATE_KEY) ?? '{}'),
    )
    return parsed.success ? parsed.output : v.parse(savedStateSchema, {})
  } catch {
    return v.parse(savedStateSchema, {})
  }
}

const saved = savedState()

// The token is kept for both apps (authToken.ts), not in this blob, and only where it is the
// token of the moderator the blob holds: a token of somebody else would run under their role.
const kept = readAuthToken()

export const adminStore: AdminState = {
  ...saved,
  token: CONFIG.DEBUG_DISABLE_AUTH
    ? 'validToken'
    : kept && tokenBelongsTo(kept.token, saved.moderator?.gradidoID)
      ? kept.token
      : null,
}

const save = () => {
  const {
    moderator,
    openCreations,
    openSupportTickets,
    handledCreationGroups,
    handledSupportGroups,
  } = adminStore
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      moderator,
      openCreations,
      openSupportTickets,
      handledCreationGroups,
      handledSupportGroups,
    }),
  )
}

export const setToken = (token: string | null) => {
  adminStore.token = token
  keepAuthToken(token)
  save()
}

export const setModerator = (moderator: Moderator | null) => {
  adminStore.moderator = moderator
  save()
}

export const setOpenCreations = (openCreations: number) => {
  adminStore.openCreations = openCreations
  save()
}

/** The support requests of the open tab (Support-Anfragen K3), for the badges. */
export const setOpenSupportTickets = (openSupportTickets: number) => {
  adminStore.openSupportTickets = openSupportTickets
  save()
}

// One mark per column for every question or save as it goes out (MG1, MG2b), and the mark of the
// answer last kept: an answer is kept only where it is newer than that one. A slow start page, asked
// before a save and answering after it, keeps nothing -- it must not put back the choice from before
// the save. A save answered while a later question is still out is kept, and that question's answer
// overtakes it once it comes; where that question fails, the save stands. Apart per column, since a
// question about one column overtakes nothing of the other.
const marks = {
  handledCreationGroups: { asked: 0, kept: 0 },
  handledSupportGroups: { asked: 0, kept: 0 },
}
type Column = keyof typeof marks

/** A question about the column "Schöpfung", or a save, goes out: the mark its answer is kept under. */
export const askingHandledCreationGroups = () => ++marks.handledCreationGroups.asked

/** A question about the column "Support", or a save, goes out: the mark its answer is kept under. */
export const askingHandledSupportGroups = () => ++marks.handledSupportGroups.asked

/**
 * Keeps the choice of a column the server answered for `of`, the moderator the question was asked
 * for -- where that is still the moderator signed in, and no answer to a later question or save was
 * kept before it (`asked`, from askingHandled…Groups): an answer arriving after a change of moderator
 * in this browser is nobody's to keep, one older than the choice kept is out of date.
 */
const keepColumn = (
  column: Column,
  of: string | undefined,
  choice: HandledCreationGroups,
  asked: number,
) => {
  const mark = marks[column]
  if (!of || of !== adminStore.moderator?.gradidoID || asked <= mark.kept) {
    return
  }
  mark.kept = asked
  adminStore[column] = { of, ...choice }
  save()
}

/** Keeps the column "Schöpfung" (MG1), as keepColumn says. */
export const keepHandledCreationGroups = (
  of: string | undefined,
  choice: HandledCreationGroups,
  asked: number,
) => keepColumn('handledCreationGroups', of, choice, asked)

/** Keeps the column "Support" (MG2b), as keepColumn says. */
export const keepHandledSupportGroups = (
  of: string | undefined,
  choice: HandledCreationGroups,
  asked: number,
) => keepColumn('handledSupportGroups', of, choice, asked)

export const logout = () => {
  adminStore.handledCreationGroups = null
  adminStore.handledSupportGroups = null
  setToken(null)
  setModerator(null)
  // Only the admin's own blob: wallet and admin share one origin, and localStorage.clear()
  // would also wipe the wallet's state and the shared theme.
  localStorage.removeItem(STATE_KEY)
  forgetModeratorContacts()
  forgetMemberAvatars()
  closeMemberAvatarZoom()
}

// A renewal in the wallet or another window renews this one too, a logout there signs this one
// out, a sign-in of somebody else reloads it (authToken.ts).
followAuthToken({
  get token() {
    return adminStore.token
  },
  setToken,
  logout: () => {
    logout()
    m.redraw()
  },
})
