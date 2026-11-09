// AI-GENERATED — not an architecture reference
import { memberAvatars } from '@admin/graphql/memberAvatars'
import { type MemberRef, memberKey } from '@/data/Member.logic'
import { graphqlRequest } from '@/graphql/client'

/** What a list carries of a member for their circle: who they are, and the date of the picture. */
export type AvatarMember = {
  gradidoID: string
  communityUuid: string
  avatarUpdatedAt: string | null
}

type Picture = { avatar: string; avatarUpdatedAt: string }

/**
 * The pictures of members fetched while the moderator is signed in. A picture counts while its
 * date is the one the list brings: a changed date asks for exactly the member who changed it.
 */
const pictures = new Map<string, Picture>()
// Raised as the pictures are forgotten: an answer to a question asked before is dropped, so that
// no picture of one moderator's session waits for the next.
let generation = 0

const sameMoment = (one: string, other: string | null) =>
  other !== null && new Date(one).getTime() === new Date(other).getTime()

const held = (member: MemberRef & { avatarUpdatedAt: string | null }) => {
  const picture = pictures.get(memberKey(member))
  return picture && sameMoment(picture.avatarUpdatedAt, member.avatarUpdatedAt) ? picture : null
}

/** The picture of `member` as an image source, where this device holds the current one. */
export const memberAvatarSource = (member: AvatarMember) => {
  const picture = held(member)
  return picture ? `data:image/jpeg;base64,${picture.avatar}` : undefined
}

/**
 * Asks in one request for the pictures these members show and this device does not hold; a
 * member without a date shows none. Best effort: a circle without its picture keeps its letters.
 */
export const askMemberAvatars = async (members: AvatarMember[]) => {
  // one entry per member, however many rows they have
  const wanted = new Map(
    members
      .filter((member) => member.avatarUpdatedAt !== null && !held(member))
      .map(({ gradidoID, communityUuid }) => [
        memberKey({ gradidoID, communityUuid }),
        { gradidoID, communityUuid },
      ]),
  )
  if (wanted.size === 0) {
    return
  }
  const asked = generation
  const answer = await graphqlRequest<{ memberAvatars: (AvatarMember & Picture)[] }>(
    memberAvatars,
    { refs: [...wanted.values()] },
  )
  if (!answer.success || asked !== generation) {
    return
  }
  for (const picture of answer.value.memberAvatars) {
    pictures.set(memberKey(picture), picture)
  }
}

/** Forgets every picture: they are other people's faces, held for this session only. */
export const forgetMemberAvatars = () => {
  pictures.clear()
  generation++
}
