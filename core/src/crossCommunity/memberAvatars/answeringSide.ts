import {
  dbFindMemberAvatarFull,
  dbFindMemberAvatarsSmall,
  dbFindMemberAvatarTimestampsByGradidoIds,
  getHomeCommunityDrizzle,
} from 'database'
import { MemberAvatarFullQuestion, MemberAvatarsQuestion } from '../schema'

// Another community asks about the pictures of members of THIS one. Who is shown decides
// mayBeShownToMembers() inside each query, as for a member of this community asking.
// ⛔ No entry for a member who is unknown, has no picture, switched it off or is deleted, and
// never an error for any of that: one answer for all of them, so that asking cannot be used to
// find out which accounts exist.

/** The small renditions with their dates, for the lists. */
export async function memberAvatarsSmall({ body }: { body: MemberAvatarsQuestion }) {
  const rows = await dbFindMemberAvatarsSmall(body.gradidoIds)
  return rows.map((row) => ({
    gradidoId: row.gradidoId,
    avatarUpdatedAt: row.updatedAt.toISOString(),
    avatar: row.avatarSmall.toString('base64'),
  }))
}

/** Only when each picture last changed, no picture data (AS-019). */
export async function memberAvatarDates({ body }: { body: MemberAvatarsQuestion }) {
  const dates = await dbFindMemberAvatarTimestampsByGradidoIds(body.gradidoIds)
  return [...dates].map(([gradidoId, updatedAt]) => ({
    gradidoId,
    avatarUpdatedAt: updatedAt.toISOString(),
  }))
}

/** The full rendition of one member, for the zoom (AS-020), or null. */
export async function memberAvatarFull({ body }: { body: MemberAvatarFullQuestion }) {
  // by the pair: this community is the member's home, so its uuid is the other half
  const { communityUuid } = await getHomeCommunityDrizzle()
  const avatar = await dbFindMemberAvatarFull(body.gradidoId, communityUuid)
  return avatar ? avatar.toString('base64') : null
}
