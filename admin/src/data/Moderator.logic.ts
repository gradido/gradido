// AI-GENERATED — not an architecture reference
import type { HandledCreationGroups, KeptHandledCreationGroups } from './CreationGroup.schema'
import type { Moderator } from './Moderator.schema'

/**
 * Whether the support is the signed-in moderator's to see (Support-Anfragen K6): an administrator
 * always, a moderator or KI-moderator with the tick. The menu, the start page and the route ask
 * this one question; the server's rights stay the final word (askOpenSupportTickets).
 *
 * ⛔ The role first, not the tick alone: a state kept from before K6 carries no tick, and an
 * administrator must not lose the support until they come in through the wallet again.
 */
export const supportIsTheirs = (moderator: Moderator | null): boolean =>
  moderator?.role === 'ADMIN' || moderator?.handlesSupportTickets === true

/**
 * Whether the signed-in moderator chooses "Meine Gruppen" (MG1): one with a role who sees every
 * creation group. For a moderator with an assigned scope the scope is their list. The server
 * decides the same from the role of the moment (handledCreationGroupsOf).
 */
export const mayChooseGroups = (moderator: Moderator | null): boolean =>
  Boolean(moderator?.role) && moderator?.seesAllCreationGroups === true

/**
 * Whether the signed-in moderator may switch the creations or the support off for themself in "Meine
 * Gruppen" (MG5): an administrator. What a moderator handles, an administrator assigns. The server
 * decides the same (maySwitchHandledGroupsOff).
 */
export const maySwitchOff = (moderator: Moderator | null): boolean =>
  mayChooseGroups(moderator) && moderator?.role === 'ADMIN'

/** Whether `kept` is a choice of the signed-in moderator's, who may choose. */
const isOfModerator = (moderator: Moderator | null, kept: KeptHandledCreationGroups | null) =>
  Boolean(kept) && mayChooseGroups(moderator) && kept?.of === moderator?.gradidoID

/**
 * The choice that counts for the signed-in moderator, from what the admin keeps: null where they
 * may not choose, where the kept choice is somebody else's who used this browser, where nothing is
 * ticked ("everything, as before"), and where the column is switched off, which narrows no filter
 * (isSwitchedOff).
 */
export const chosenGroupsOf = (
  moderator: Moderator | null,
  kept: KeptHandledCreationGroups | null,
): HandledCreationGroups | null =>
  kept &&
  isOfModerator(moderator, kept) &&
  !isSwitchedOff(moderator, kept) &&
  (kept.groupIds.length > 0 || kept.untagged)
    ? { groupIds: kept.groupIds, untagged: kept.untagged, off: false }
    : null

/** Whether the signed-in administrator switched the column of `kept` off (MG5). */
export const isSwitchedOff = (
  moderator: Moderator | null,
  kept: KeptHandledCreationGroups | null,
): boolean => maySwitchOff(moderator) && isOfModerator(moderator, kept) && kept?.off === true
