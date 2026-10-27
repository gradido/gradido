// AI-GENERATED — not an architecture reference

/**
 * One key for the subject of a member's own note, from wherever the wallet meets it: a contact row,
 * a group row, or an entry of the notes the server lists (userNotes). In lower case, as the server
 * keeps the uuids; a member without a community is one of this community, as the server reads it.
 */
export const noteKeyOfMember = (user, homeCommunityUuid) =>
  `member:${(user.communityUuid ?? homeCommunityUuid ?? '').toLowerCase()}/${user.gradidoID.toLowerCase()}`

export const noteKeyOfGroup = (groupUuid) => `group:${groupUuid.toLowerCase()}`

export const noteKeyOfEntry = (entry, homeCommunityUuid) =>
  entry.groupUuid
    ? noteKeyOfGroup(entry.groupUuid)
    : noteKeyOfMember(
        { communityUuid: entry.communityUuid, gradidoID: entry.gradidoID },
        homeCommunityUuid,
      )
