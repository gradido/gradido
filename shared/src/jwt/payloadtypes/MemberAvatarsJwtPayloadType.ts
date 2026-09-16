// AI-GENERATED — not an architecture reference
import { JwtPayloadType } from './JwtPayloadType'

/**
 * What one community asks another about the pictures of that other community's members.
 *
 * - `small`: the 128 rendition with its date, for the lists (at most MEMBER_AVATARS_MAX_REFS
 *   ids).
 * - `full`: the 512 rendition of exactly ONE member, for the zoom (AS-020).
 * - `dates`: only when each picture last changed, no picture data (AS-019).
 *
 * One query with three kinds rather than three queries: the caps depend on the kind, and the
 * list they limit travels inside the encrypted payload, where GraphQL cannot see it. The
 * answering resolver checks them after decrypting (federation MemberAvatarsResolver).
 */
export const MEMBER_AVATARS_KINDS = ['small', 'full', 'dates'] as const
export type MemberAvatarsKind = (typeof MEMBER_AVATARS_KINDS)[number]

/** For the answering side, which reads the kind out of a payload another server wrote. */
export const isMemberAvatarsKind = (value: unknown): value is MemberAvatarsKind =>
  (MEMBER_AVATARS_KINDS as readonly unknown[]).includes(value)

export class MemberAvatarsJwtPayloadType extends JwtPayloadType {
  static MEMBER_AVATARS_TYPE = 'member-avatars'

  kind: MemberAvatarsKind
  gradidoIDs: string[]

  constructor(handshakeID: string, kind: MemberAvatarsKind, gradidoIDs: string[]) {
    super(handshakeID)
    this.tokentype = MemberAvatarsJwtPayloadType.MEMBER_AVATARS_TYPE
    this.kind = kind
    this.gradidoIDs = gradidoIDs
  }
}
