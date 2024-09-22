import { Community } from '@entity/Community'
import { FindOptionsSelect, In, IsNull, Not } from 'typeorm'

import { CommunityArg } from '@/graphql/arg/CommunityArg'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'
import { LogError } from '@/server/LogError'
import { getDataSource } from '@/typeorm/DataSource'
import { uuid4ToHash } from '@/utils/typeConverter'

import { KeyPair } from './KeyPair'

export const CommunityRepository = getDataSource()
  .getRepository(Community)
  .extend({
    async isExist(community: CommunityDraft | string): Promise<boolean> {
      const iotaTopic =
        community instanceof CommunityDraft ? uuid4ToHash(community.uuid) : community
      const result = await this.find({
        where: { iotaTopic },
      })
      return result.length > 0
    },

    async findByCommunityArg({ uuid, foreign, confirmed }: CommunityArg): Promise<Community[]> {
      return await this.find({
        where: {
          ...(uuid && { iotaTopic: uuid4ToHash(uuid) }),
          ...(foreign && { foreign }),
          ...(confirmed && { confirmedAt: Not(IsNull()) }),
        },
      })
    },

    async findByCommunityUuid(communityUuid: string): Promise<Community | null> {
      return await this.findOneBy({ iotaTopic: uuid4ToHash(communityUuid) })
    },

    async findByIotaTopic(iotaTopic: string): Promise<Community | null> {
      return await this.findOneBy({ iotaTopic })
    },

    findCommunitiesByTopics(topics: string[]): Promise<Community[]> {
      return this.findBy({ iotaTopic: In(topics) })
    },

    async getCommunityForUserIdentifier(
      identifier: UserIdentifier,
    ): Promise<Community | undefined> {
      if (!identifier.communityUuid) {
        throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'community uuid not set')
      }
      return (
        (await this.findOneBy({
          iotaTopic: uuid4ToHash(identifier.communityUuid),
        })) ?? undefined
      )
    },

    findAll(select: FindOptionsSelect<Community>): Promise<Community[]> {
      return this.find({ select })
    },

    async loadHomeCommunityKeyPair(): Promise<KeyPair> {
      const community = await this.findOneOrFail({
        where: { foreign: false },
        select: { rootChaincode: true, rootPubkey: true, rootEncryptedPrivkey: true },
      })
      if (!community.rootChaincode || !community.rootEncryptedPrivkey) {
        throw new LogError('Missing chaincode or private key for home community')
      }
      return new KeyPair(community)
    },

    async loadHomeCommunity(): Promise<Community> {
      return await this.findOneOrFail({
        where: { foreign: false },
      })
    },
  })
