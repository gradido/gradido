import { Community as DbCommunity } from '@entity/Community'

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
