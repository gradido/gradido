import { TransactionsManager } from '@/controller/TransactionsManager'
import { CommunityArg } from '@/graphql/arg/CommunityArg'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { getDataSource } from '@/typeorm/DataSource'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'
import { Community } from '@entity/Community'
import { FindOptionsSelect, In, IsNull, Not } from 'typeorm'

export const CommunityRepository = getDataSource()
  .getRepository(Community)
  .extend({
    async isExist(community: CommunityDraft | string): Promise<boolean> {
      const iotaTopic =
        community instanceof CommunityDraft ? iotaTopicFromCommunityUUID(community.uuid) : community
      const result = await Community.find({
        where: { iotaTopic },
      })
      return result.length > 0
    },

    async findByCommunityArg({ uuid, foreign, confirmed }: CommunityArg): Promise<Community[]> {
      return await Community.find({
        where: {
          ...(uuid && { iotaTopic: iotaTopicFromCommunityUUID(uuid) }),
          ...(foreign && { foreign }),
          ...(confirmed && { confirmedAt: Not(IsNull()) }),
        },
      })
    },

    async findByCommunityUuid(communityUuid: string): Promise<Community | null> {
      return await Community.findOneBy({ iotaTopic: iotaTopicFromCommunityUUID(communityUuid) })
    },

    async findByIotaTopic(iotaTopic: string): Promise<Community | null> {
      return await Community.findOneBy({ iotaTopic })
    },

    findCommunitiesByTopics(topics: string[]): Promise<Community[]> {
      return Community.findBy({ iotaTopic: In(topics) })
    },

    async getCommunityForUserIdentifier(
      identifier: UserIdentifier,
    ): Promise<Community | undefined> {
      const topic = identifier.communityUuid
        ? iotaTopicFromCommunityUUID(identifier.communityUuid)
        : TransactionsManager.getInstance().getHomeCommunityTopic()
      return (await Community.findOneBy({ iotaTopic: topic })) ?? undefined
    },

    findAll(select: FindOptionsSelect<Community>): Promise<Community[]> {
      return Community.find({ select })
    },
  })
