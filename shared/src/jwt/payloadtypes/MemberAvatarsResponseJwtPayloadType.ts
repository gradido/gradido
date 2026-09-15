// AI-GENERATED — not an architecture reference
import { JwtPayloadType } from './JwtPayloadType'

/**
 * One member who has a picture to show. A member who has none -- no picture, switch off,
 * deleted, unknown -- has no entry at all, never an error, so that asking cannot be used
 * to find out which accounts exist.
 */
export interface MemberAvatarPayload {
  gradidoID: string
  /** ISO 8601. */
  avatarUpdatedAt: string
  /** Base64 of the requested rendition; null for kind `dates`. */
  avatar: string | null
}

export class MemberAvatarsResponseJwtPayloadType extends JwtPayloadType {
  static MEMBER_AVATARS_RESPONSE_TYPE = 'member-avatars-response'

  members: MemberAvatarPayload[]

  constructor(handshakeID: string, members: MemberAvatarPayload[]) {
    super(handshakeID)
    this.tokentype = MemberAvatarsResponseJwtPayloadType.MEMBER_AVATARS_RESPONSE_TYPE
    this.members = members
  }
}
