// AI-GENERATED — not an architecture reference
import type { UserNoteSubject } from 'database'

/**
 * How many of a member's own notes one HTTP request may read or write (userNote, setUserNote):
 * a document may repeat a field under any number of aliases (RequestBudget). The wallet asks for
 * one at a time.
 */
export const USER_NOTES_MAX_PER_REQUEST = 5

/** What a note input names: a person by the pair the wallet holds, or a group by its uuid. */
export interface UserNoteAbout {
  member?: { gradidoID: string } | null
  groupUuid?: string | null
}

/**
 * The subject a note input names, as the table keeps it (UserNoteSubject): a person by their
 * community and gradido id, a group by its uuid with the community ''. Lower case, so that one
 * person or group is one row however a client spells the uuids (a group's link may come in
 * capitals).
 *
 * `memberCommunityUuid` is the person's community, already resolved (resolveCommunityUuid); it is
 * not read for a group.
 *
 * Null where the input names neither or both: a request that does not say what its note is about
 * is refused, not guessed.
 */
export const userNoteSubjectOf = (
  about: UserNoteAbout,
  memberCommunityUuid: string,
): UserNoteSubject | null => {
  const member = about.member ?? null
  const groupUuid = about.groupUuid || null
  if (Boolean(member) === Boolean(groupUuid)) {
    return null
  }
  if (member) {
    return {
      kind: 'member',
      communityUuid: memberCommunityUuid.toLowerCase(),
      uuid: member.gradidoID.toLowerCase(),
    }
  }
  return { kind: 'group', communityUuid: '', uuid: (groupUuid as string).toLowerCase() }
}

/** An emptied note is taken away rather than kept as an empty row: whitespace alone says nothing. */
export const isEmptyNote = (note: string): boolean => note.trim() === ''
