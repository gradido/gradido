import { FindOptionsWhere } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'

import { CommunityArgs } from '@/graphql/arg/CommunityArgs'

export async function isHomeCommunity(communityIdentifier: string): Promise<boolean> {
  const homeCommunity = await DbCommunity.findOne({
    where: [
      { foreign: false, communityUuid: communityIdentifier },
      { foreign: false, name: communityIdentifier },
      { foreign: false, url: communityIdentifier },
    ],
  })
  if (homeCommunity) {
    return true
  } else {
    return false
  }
}

export async function getHomeCommunity(): Promise<DbCommunity> {
  return await DbCommunity.findOneOrFail({
    where: [{ foreign: false }],
  })
}

export async function getCommunityUrl(communityIdentifier: string): Promise<string> {
  const community = await DbCommunity.findOneOrFail({
    where: [
      { communityUuid: communityIdentifier },
      { name: communityIdentifier },
      { url: communityIdentifier },
    ],
  })
  return community.url
}

export async function isCommunityAuthenticated(communityIdentifier: string): Promise<boolean> {
  const community = await DbCommunity.findOne({
    where: [
      { communityUuid: communityIdentifier },
      { name: communityIdentifier },
      { url: communityIdentifier },
    ],
  })
  if (community?.authenticatedAt) {
    return true
  } else {
    return false
  }
}

export async function getCommunityName(communityIdentifier: string): Promise<string> {
  const community = await DbCommunity.findOne({
    where: [{ communityUuid: communityIdentifier }, { url: communityIdentifier }],
  })
  if (community?.name) {
    return community.name
  } else {
    return ''
  }
}

export async function getCommunity({
  communityUuid,
  foreign,
}: CommunityArgs): Promise<DbCommunity | null> {
  return await DbCommunity.findOne({
    where: {
      ...(foreign !== null && foreign !== undefined && { foreign }),
      ...(communityUuid && { communityUuid }),
    },
  })
}
