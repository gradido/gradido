// AI-GENERATED — not an architecture reference

/**
 * The pair that names a person in the chat (KF-004), written the one way the server compares it:
 * in lower case, and a missing community written as this community's own uuid -- the server
 * reads a missing community as its own, so `null` and the own uuid are one person.
 *
 * ⛔ This is what keeps a thread standing while its person is filled in: a member off a booking
 * row comes without a community, the lookup for the figures brings it a moment later
 * (useContactWindow.openMember), and a key that wrote the two differently made a new thread
 * under a reading eye (LOG-036). Where the own uuid is not known yet, a missing community is
 * written empty, as before.
 *
 * @param member `{ communityUuid, gradidoID }`, as a contact row, a message's sender or a
 *   window's person carries it
 * @param ownCommunityUuid the signed-in member's community, for a member who names none
 */
export const chatMemberKey = (member, ownCommunityUuid = null) =>
  `${(member?.communityUuid ?? ownCommunityUuid ?? '').toLowerCase()}/${(member?.gradidoID ?? '').toLowerCase()}`
