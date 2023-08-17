import { Community as DbCommunity } from '@entity/Community'

export async function isHomeCommunity(communityIdentifier: string): Promise<boolean> {
  const homeCommunity = await DbCommunity.findOneByOrFail({ foreign: false })
  if (communityIdentifier === homeCommunity.name) {
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
