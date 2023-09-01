import { Community as DbCommunity } from '@entity/Community'

export async function isHomeCommunity(communityIdentifier: string): Promise<boolean> {
  const homeCommunity = await DbCommunity.findOneByOrFail({ foreign: false })
  if (communityIdentifier === homeCommunity.id.toString()) {
    return true
  } else if (communityIdentifier === homeCommunity.name) {
    return true
  } else if (communityIdentifier === homeCommunity.communityUuid) {
    return true
  } else if (communityIdentifier === homeCommunity.url) {
    return true
  } else {
    return false
  }
}

export async function getCommunityUrl(communityIdentifier: string): Promise<string> {
  const community = await DbCommunity.findOneByOrFail({ name: communityIdentifier })
  return community.url
}

export async function isCommunityAuthenticated(communityIdentifier: string): Promise<boolean> {
  const community = await DbCommunity.findOneOrFail({
    where: [
      { communityUuid: communityIdentifier },
      { name: communityIdentifier },
      { url: communityIdentifier },
    ],
  })
  if (community.authenticatedAt) {
    return true
  } else {
    return false
  }
}
