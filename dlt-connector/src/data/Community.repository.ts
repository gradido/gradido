import { Community } from '@entity/Community'
import { FindOptionsSelect, In, IsNull, Not } from 'typeorm'

import { CommunityArg } from '@/graphql/arg/CommunityArg'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'
import { getDataSource } from '@/typeorm/DataSource'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'

import { KeyPair } from './KeyPair.model'

export const CommunityRepository = getDataSource()
  .getRepository(Community)
  .extend({
    async isExist(community: CommunityDraft | string): Promise<boolean> {
      const iotaTopic =
        community instanceof CommunityDraft ? iotaTopicFromCommunityUUID(community.uuid) : community
      const result = await this.find({
        where: { iotaTopic },
      })
      return result.length > 0
    },

    async findByCommunityArg({ uuid, foreign, confirmed }: CommunityArg): Promise<Community[]> {
      return await this.find({
        where: {
          ...(uuid && { iotaTopic: iotaTopicFromCommunityUUID(uuid) }),
          ...(foreign && { foreign }),
          ...(confirmed && { confirmedAt: Not(IsNull()) }),
        },
      })
    },

    async findByCommunityUuid(communityUuid: string): Promise<Community | null> {
      return await this.findOneBy({ iotaTopic: iotaTopicFromCommunityUUID(communityUuid) })
    },

    async findByIotaTopic(iotaTopic: string): Promise<Community | null> {
      return await this.findOneBy({ iotaTopic })
    },

    async findByIotaTopicWithAccounts(iotaTopic: string): Promise<Community | null> {
      return await this.findOne({
        where: { iotaTopic },
        relations: { aufAccount: true, gmwAccount: true },
      })
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
          iotaTopic: iotaTopicFromCommunityUUID(identifier.communityUuid),
        })) ?? undefined
      )
    },

    findAll(select: FindOptionsSelect<Community>): Promise<Community[]> {
      return this.find({ select })
    },

    async loadHomeCommunityKeyPair(): Promise<KeyPair> {
      const community = await this.findOneOrFail({
        where: { foreign: false },
        select: { rootChaincode: true, rootPubkey: true, rootPrivkey: true },
      })
      if (!community.rootChaincode || !community.rootPrivkey) {
        throw new LogError('Missing chaincode or private key for home community')
      }
      return new KeyPair(community)
    },

    /**
     * confirm community and auf and gwm account with only one mysql query
     * @param confirmedAt
     * @param iotaTopic
     * @returns true if update was successful
     */
    async confirmCommunityAndAccounts(
      confirmedAt: Date,
      iotaTopic: string,
      rootPublicKey: Buffer | undefined,
    ): Promise<boolean> {
      /* I don't know how todo it with the query builder
      this.createQueryBuilder()
        .update(Community)
        .relation(Account, 'gmw').set
        .leftJoinAndSelect(Account, 'gmw', 'c.gmw_account_id = gmw.id')
        .leftJoin(Account, 'auf', 'c.auf_account_id = auf.id')
        .set({
        'c.confirmed_at': confirmedAt,
        'gmw.confirmed_at': confirmedAt,
        'auf.confirmend_at': confirmedAt,
      })
      .where('c.iota_topic = :iotaTopic', { iotaTopic })
      .execute()
      */
      const query = `
        UPDATE communities c
        LEFT JOIN accounts gmw ON c.gmw_account_id = gmw.id
        LEFT JOIN accounts auf ON c.auf_account_id = auf.id
        SET c.confirmed_at = ?, c.root_publicKey = ?
            gmw.confirmed_at = ?,
            auf.confirmed_at = ?
        WHERE c.iota_topic = ?
      `
      logger.info('confirm community', { topic: iotaTopic, confirmedAt })
      const result = await this.query(query, [
        confirmedAt,
        rootPublicKey,
        confirmedAt,
        confirmedAt,
        iotaTopic,
      ])

      if (result.affected && result.affected > 1) {
        throw new LogError('more than one community matched by topic: %s', iotaTopic)
      }
      return result.affected === 1
    },
  })
