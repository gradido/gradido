import { findUserByIdentifier } from '@/graphql/util/findUserByIdentifier'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from 'database'
import { TransactionLink as DbTransactionLink } from 'database'
import { Arg, Mutation, Resolver } from 'type-graphql'

import { decode, verify } from 'backend/src/auth/jwt/JWT'
import { DisburseJwtPayloadType } from 'backend/src/auth/jwt/payloadtypes/DisburseJwtPayloadType'
import { JwtPayloadType } from 'backend/src/auth/jwt/payloadtypes/JwtPayloadType'
import { EVENT_TRANSACTION_LINK_REDEEM } from 'backend/src/event/Events'
import { DisbursementJwtResult } from 'backend/src/federation/client/1_0/model/DisbursementJwtResult'
import {
  getCommunityByIdentifier,
  getHomeCommunity,
} from 'backend/src/graphql/resolver/util/communities'
import { getCommunityByUuid } from 'backend/src/graphql/resolver/util/communities'
import { invokeXComSendCoins } from 'backend/src/graphql/resolver/util/invokeXComSendCoins'
import Decimal from 'decimal.js-light'
import { getConnection, IsNull } from 'typeorm'

@Resolver()
export class DisbursementJwtResolver {
  @Mutation(() => DisbursementJwtResult)
  async disburseJwt(
    @Arg('jwt')
    jwt: string,
  ): Promise<DisbursementJwtResult> {
    logger.debug(`disburseJwt() via apiVersion=1_0 ...`, jwt)
    const result = new DisbursementJwtResult()
    const receivedCallDate = new Date()
    try {
      // decode token first to get the recipientCommunityUuid as input for verify token
      const decodedPayload = decode(jwt)
      logger.debug('DisbursementJwtResolver.disburseJwt... decodedPayload=', decodedPayload)
      let verifiedJwtPayload: JwtPayloadType | null = null
      let homeCommunity: DbCommunity | null = null
      if (
        decodedPayload != null &&
        decodedPayload.tokentype === DisburseJwtPayloadType.DISBURSE_ACTIVATION_TYPE
      ) {
        const disburseJwtPayload = new DisburseJwtPayloadType(
          decodedPayload.sendercommunityuuid as string,
          decodedPayload.sendergradidoid as string,
          decodedPayload.recipientcommunityuuid as string,
          decodedPayload.recipientcommunityname as string,
          decodedPayload.recipientgradidoid as string,
          decodedPayload.recipientfirstname as string,
          decodedPayload.code as string,
          decodedPayload.amount as string,
          decodedPayload.memo as string,
          decodedPayload.validuntil as string,
          decodedPayload.recipientalias as string,
        )
        logger.debug(
          'DisbursementJwtResolver.disburseJwt... disburseJwtPayload=',
          disburseJwtPayload,
        )
        homeCommunity = await getHomeCommunity()
        if (
          !homeCommunity ||
          disburseJwtPayload.sendercommunityuuid !== homeCommunity.communityUuid
        ) {
          result.message = 'Sender community does not match home community'
          result.accepted = false
          logger.error(result.message)
          return result
        }

        let recipientCom = await getCommunityByUuid(disburseJwtPayload.recipientcommunityuuid)
        if (!recipientCom) {
          recipientCom = await getCommunityByIdentifier(disburseJwtPayload.recipientcommunityname)
          if (!recipientCom) {
            result.message =
              'Recipient community not found: ' + disburseJwtPayload.recipientcommunityname
            result.accepted = false
            logger.error(result.message)
            return result
          }
        }
        logger.debug('DisbursementJwtResolver.disburseJwt... recipientCom=', recipientCom)
        if (!recipientCom.communityUuid) {
          result.message =
            'Recipient community currently not authenticated on sender-side! Its UUID is still unknown.'
          result.accepted = false
          logger.error(result.message)
          return result
        }
        // now with the recipient community UUID the jwt token can be verified
        verifiedJwtPayload = await verify(jwt, recipientCom.communityUuid)
        if (!verifiedJwtPayload) {
          result.message = 'Invalid disbursement JWT'
          result.accepted = false
          logger.error(result.message)
          return result
        }
        logger.debug(
          'DisbursementJwtResolver.disburseJwt... nach verify verifiedJwtPayload=',
          verifiedJwtPayload,
        )
        if (verifiedJwtPayload.exp !== undefined) {
          const expDate = new Date(verifiedJwtPayload.exp * 1000)
          logger.debug(
            'DisbursementJwtResolver.disburseJwt... expDate, exp =',
            expDate,
            verifiedJwtPayload.exp,
          )
          if (expDate < receivedCallDate) {
            result.message = 'Disbursement JWT-Token expired! jwtPayload.exp=' + expDate
            result.accepted = false
            logger.error(result.message)
            return result
          }
        }
        if (verifiedJwtPayload.payload.tokentype === DisburseJwtPayloadType.DISBURSE_ACTIVATION_TYPE) {
          logger.debug(
            'DisbursementJwtResolver.disburseJwt... verifiedJwtPayload.tokentype=',
            verifiedJwtPayload.payload.tokentype,
          )
          const verifiedDisburseJwtPayload = new DisburseJwtPayloadType(
            verifiedJwtPayload.payload.sendercommunityuuid as string,
            verifiedJwtPayload.payload.sendergradidoid as string,
            verifiedJwtPayload.payload.recipientcommunityuuid as string,
            verifiedJwtPayload.payload.recipientcommunityname as string,
            verifiedJwtPayload.payload.recipientgradidoid as string,
            verifiedJwtPayload.payload.recipientfirstname as string,
            verifiedJwtPayload.payload.code as string,
            verifiedJwtPayload.payload.amount as string,
            verifiedJwtPayload.payload.memo as string,
            verifiedJwtPayload.payload.validuntil as string,
            verifiedJwtPayload.payload.recipientalias as string,
          )
          logger.debug(
            'DisbursementJwtResolver.disburseJwt... nach verify verifiedDisburseJwtPayload=',
            verifiedDisburseJwtPayload,
          )
          const senderUser = await findUserByIdentifier(
            verifiedDisburseJwtPayload.sendergradidoid,
            homeCommunity?.communityUuid,
          )
          const transactionLink = await DbTransactionLink.findOne({
            where: { code: verifiedDisburseJwtPayload.code, redeemedAt: IsNull(), redeemedBy: IsNull() },
          })
          if (!transactionLink) {
            result.message = 'Link not exists or already redeemed!'
            result.accepted = false
            logger.error(result.message)
            return result
          }

          logger.debug('DisbursementJwtResolver.disburseJwt... vor invokeXComSendCoins...')
          await invokeXComSendCoins(
            homeCommunity,
            verifiedDisburseJwtPayload.recipientcommunityuuid,
            new Decimal(verifiedDisburseJwtPayload.amount),
            verifiedDisburseJwtPayload.memo,
            senderUser,
            verifiedDisburseJwtPayload.recipientgradidoid,
          )
          logger.debug('DisbursementJwtResolver.disburseJwt... nach invokeXComSendCoins...')
          // after XComSendCoins the recipientUser exists as foreign user locally
          const recipientUser = await findUserByIdentifier(
            verifiedDisburseJwtPayload.recipientgradidoid,
            verifiedDisburseJwtPayload.recipientcommunityuuid
          )
          logger.debug('DisbursementJwtResolver.disburseJwt... vor EVENT_TRANSACTION_LINK_REDEEM...')
          await EVENT_TRANSACTION_LINK_REDEEM(recipientUser, senderUser, transactionLink, new Decimal(verifiedDisburseJwtPayload.amount))
          logger.debug('DisbursementJwtResolver.disburseJwt... nach EVENT_TRANSACTION_LINK_REDEEM...')

          if (transactionLink) {
            logger.debug('DisbursementJwtResolver.disburseJwt... update transactionLink...')
            const queryRunner = getConnection().createQueryRunner()
            await queryRunner.connect()
            await queryRunner.startTransaction('REPEATABLE READ')
            try {
              const recipientUser = await findUserByIdentifier(
                verifiedDisburseJwtPayload.recipientgradidoid,
                recipientCom?.communityUuid,
              )
              logger.info('transactionLink', transactionLink)
              transactionLink.redeemedAt = receivedCallDate
              transactionLink.redeemedBy = recipientUser.id
              await queryRunner.manager.update(
                DbTransactionLink,
                { id: transactionLink.id },
                transactionLink,
              )
              await queryRunner.commitTransaction()
              await queryRunner.release()
              logger.debug('DisbursementJwtResolver.disburseJwt... update transactionLink... done')
            } catch (error) {
              await queryRunner.rollbackTransaction()
              await queryRunner.release()
              result.message = 'DisbursementJwtResolver.disburseJwt... update transactionLink... error=' + error
              result.accepted = false
              logger.error(result.message)
              return result
            }
            result.message = 'disburseJwt successful'
            result.accepted = true
            logger.info(result.message)
            return result
          }
        }
      }
    } catch (error) {
      result.message = 'Error in DisbursementJwtResolver.disburseJwt... error=' + error
      result.accepted = false
      logger.error(result.message)
      return result
    }
    return result
  }
}
