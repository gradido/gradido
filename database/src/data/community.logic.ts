import { eq } from 'drizzle-orm'
import { CommunityIdentifier, urlSchema, uuidv4Schema } from 'shared'
import * as v from 'valibot'
import { communitiesTable } from '../schemas'

export function eqCommunityIdentifier(communityIdentifier: CommunityIdentifier) {
  if (typeof communityIdentifier !== 'string') {
    return eq(communitiesTable.publicKey, communityIdentifier)
  }
  const isUuidv4 = v.safeParse(uuidv4Schema, communityIdentifier)
  if (isUuidv4.success) {
    return eq(communitiesTable.communityUuid, isUuidv4.output)
  }
  const isUrl = v.safeParse(urlSchema, communityIdentifier)
  if (isUrl.success) {
    return eq(communitiesTable.url, isUrl.output)
  }
  return eq(communitiesTable.name, communityIdentifier)
}
