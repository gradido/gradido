import { Community } from '@entity/Community'

import { KeyPair } from '@/data/KeyPair'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { AddCommunityContext } from '@/interactions/backendToDb/community/AddCommunity.context'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'

export const communitySeed = async (
  uuid: string,
  foreign: boolean,
  keyPair: KeyPair | undefined = undefined,
): Promise<Community> => {
  const homeCommunityDraft = new CommunityDraft()
  homeCommunityDraft.uuid = uuid
  homeCommunityDraft.foreign = foreign
  homeCommunityDraft.createdAt = new Date().toISOString()
  const iotaTopic = iotaTopicFromCommunityUUID(uuid)
  const addCommunityContext = new AddCommunityContext(homeCommunityDraft, iotaTopic)
  await addCommunityContext.run()

  const community = await Community.findOneOrFail({ where: { iotaTopic } })
  if (foreign && keyPair) {
    // that isn't entirely correct, normally only the public key from foreign community is know, and will be come form blockchain
    keyPair.fillInCommunityKeys(community)
    await community.save()
  }
  return community
}
