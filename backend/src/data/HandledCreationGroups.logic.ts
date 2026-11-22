// AI-GENERATED — not an architecture reference
import type { Result } from 'shared'
import * as v from 'valibot'
import {
  type HandledCreationGroups,
  handledCreationGroupsSchema,
} from './HandledCreationGroups.schema'

/** How many groups one choice may name: far more than a community has, so a runaway list is refused. */
export const HANDLED_CREATION_GROUPS_MAX = 1000

const choosesNothing = ({ groupIds, untagged, off }: HandledCreationGroups) =>
  groupIds.length === 0 && !untagged && !off

/**
 * The choice the column holds, or null where there is none to follow: no text, a text that is no
 * choice (broken JSON, another shape), and the choice of nothing, which means "everything, as
 * before".
 */
export const parseHandledCreationGroups = (
  stored: string | null | undefined,
): HandledCreationGroups | null => {
  if (!stored) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch {
    return null
  }
  const choice = v.safeParse(handledCreationGroupsSchema, parsed)
  return choice.success && !choosesNothing(choice.output) ? choice.output : null
}

/**
 * The rule of "Meine Gruppen", decided here and nowhere else: whoever sees every group and ticked
 * something handles exactly what they ticked, and an administrator who switched the column off
 * (`off`, MG5) nothing. For everybody else null, no restriction beyond what they see anyway: nothing
 * ticked, or a moderator with an assigned scope -- their scope is their list (MG1). A choice saved
 * before a scope was assigned stays in the row and counts again once the scope is taken away; a
 * switch that is off does not outlive the administrator's role, the ticks behind it do.
 */
export const handledCreationGroupsOf = (
  stored: string | null | undefined,
  {
    seesAllCreationGroups,
    maySwitchOff,
  }: { seesAllCreationGroups: boolean; maySwitchOff: boolean },
): HandledCreationGroups | null => {
  const choice = seesAllCreationGroups ? parseHandledCreationGroups(stored) : null
  if (!choice?.off || maySwitchOff) {
    return choice
  }
  const ticks = { ...choice, off: false }
  return choosesNothing(ticks) ? null : ticks
}

/**
 * A choice as the admin sends it, in the form it is stored and answered: each group once, in
 * ascending order. More than HANDLED_CREATION_GROUPS_MAX groups is refused.
 */
export const normaliseHandledCreationGroups = (
  groupIds: number[],
  untagged: boolean,
  off: boolean,
): Result<HandledCreationGroups, Error> => {
  const once = [...new Set(groupIds)].sort((a, b) => a - b)
  if (once.length > HANDLED_CREATION_GROUPS_MAX) {
    return {
      success: false,
      error: new Error(`More than ${HANDLED_CREATION_GROUPS_MAX} creation groups`),
    }
  }
  return { success: true, value: { groupIds: once, untagged, off } }
}

/**
 * The text the column stores for a choice: null for the choice of nothing, "as before". The switch
 * goes in only where it is off, so the text of every other choice is what it was.
 */
export const storedHandledCreationGroups = (choice: HandledCreationGroups): string | null =>
  choosesNothing(choice)
    ? null
    : JSON.stringify(choice.off ? choice : { groupIds: choice.groupIds, untagged: choice.untagged })
