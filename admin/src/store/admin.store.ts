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
  // "Meine Gruppen" (MG1) as the server last answered it, and for whom: read only where it is the
  // signed-in moderator's (chosenGroupsOf)
  handledCreationGroups: KeptHandledCreationGroups | null
}

/** Where the admin keeps its own state in localStorage; the key of the old admin, kept. */
const STATE_KEY = 'gradido-admin'

const savedStateSchema = v.object({
  moderator: v.optional(v.nullable(moderatorSchema), null),
  openCreations: v.optional(v.number(), 0),
  openSupportTickets: v.optional(v.number(), 0),
  handledCreationGroups: keptHandledCreationGroupsField,
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
  const { moderator, openCreations, openSupportTickets, handledCreationGroups } = adminStore
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify({ moderator, openCreations, openSupportTickets, handledCreationGroups }),
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

// The question about the choice asked last, or the save sent last (MG1): an earlier one's answer
// arriving later keeps nothing -- a slow start page must not put back the choice from before a save.
let choiceAsked = 0

/** A question about the choice, or a save of it, goes out: the mark its answer is kept under. */
export const askingHandledCreationGroups = () => ++choiceAsked

/**
 * Keeps the choice the server answered for `of`, the moderator the question was asked for -- where
 * that is still the moderator signed in, and no question or save went out after it (`asked`, from
 * askingHandledCreationGroups): an answer arriving after a change of moderator in this browser is
 * nobody's to keep, one overtaken by a later question is out of date.
 */
export const keepHandledCreationGroups = (
  of: string | undefined,
  choice: HandledCreationGroups,
  asked: number,
) => {
  if (!of || of !== adminStore.moderator?.gradidoID || asked !== choiceAsked) {
    return
  }
  adminStore.handledCreationGroups = { of, ...choice }
  save()
}

export const logout = () => {
  adminStore.handledCreationGroups = null
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
