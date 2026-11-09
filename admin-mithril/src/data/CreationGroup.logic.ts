// AI-GENERATED — not an architecture reference
import type { CreationGroup, HashtagCounts } from './CreationGroup.schema'

/**
 * The tag a group's name suggests: every letter -- umlauts and other accents too -- and digit,
 * lowercased, spaces as one hyphen -- none at the ends --, the rest dropped. The server only refuses whitespace, so what
 * is left is a valid tag.
 */
export const tagFromName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Where a group's old hashtags stand, as the words to say it with: never looked at, or looked at
 * on a day -- with how many were taken over, or none found.
 */
export const adoptionState = ({ hashtagsAdoptedAt, hashtagsAdoptedCount }: CreationGroup) =>
  hashtagsAdoptedAt === null
    ? { key: 'creationGroupsAdmin.adoption.stateUnchecked' }
    : {
        key: hashtagsAdoptedCount
          ? 'creationGroupsAdmin.adoption.stateAdopted'
          : 'creationGroupsAdmin.adoption.stateNothing',
        date: new Date(hashtagsAdoptedAt),
        count: hashtagsAdoptedCount ?? 0,
      }

/** How many contributions taking over would link: the exact ones, and the loose where chosen. */
export const adoptionTotal = ({ exact, loose }: HashtagCounts, includeLoose: boolean) =>
  exact + (includeLoose ? loose : 0)
