// AI-GENERATED — not an architecture reference
import { gql } from 'graphql-request'

/** A query, since it only reads; MemberAvatarsClient still sends it as POST. */
export const memberAvatars = gql`
  query ($args: EncryptedTransferArgs!) {
    memberAvatars(data: $args)
  }
`
