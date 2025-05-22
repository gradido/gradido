import { findUserByIdentifier } from '@/graphql/util/findUserByIdentifier'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from 'database'
import { Arg, Mutation, Resolver } from 'type-graphql'

import { decode, verify } from 'backend/src/auth/jwt/JWT'
import { DisburseJwtPayloadType } from 'backend/src/auth/jwt/payloadtypes/DisburseJwtPayloadType'
import { JwtPayloadType } from 'backend/src/auth/jwt/payloadtypes/JwtPayloadType'
import { DisbursementJwtResult } from 'backend/src/federation/client/1_0/model/DisbursementJwtResult'
import {
  getCommunityByIdentifier,
  getHomeCommunity,
} from 'backend/src/graphql/resolver/util/communities'
import { getCommunityByUuid } from 'backend/src/graphql/resolver/util/communities'
import { invokeXComSendCoins } from 'backend/src/graphql/resolver/util/invokeXComSendCoins'
import Decimal from 'decimal.js-light'

@Resolver()
export class DisbursementJwtResolver {
  @Mutation(() => DisbursementJwtResult)
  async disburseJwt(
    @Arg('jwt')
    jwt: string,
  ): Promise<DisbursementJwtResult> {
    logger.debug(`disburseJwt() via apiVersion=1_0 ...`, jwt)
    const result = new DisbursementJwtResult()
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
        if (verifiedJwtPayload?.exp !== undefined) {
          const expDate = new Date(verifiedJwtPayload.exp * 1000)
          logger.debug(
            'DisbursementJwtResolver.disburseJwt... expDate, exp =',
            expDate,
            verifiedJwtPayload.exp,
          )
          if (expDate < new Date()) {
            result.message = 'Disbursement JWT-Token expired! jwtPayload.exp=' + expDate
            result.accepted = false
            logger.error(result.message)
            return result
          }
        }
        if (verifiedJwtPayload?.tokentype === DisburseJwtPayloadType.DISBURSE_ACTIVATION_TYPE) {
          logger.debug(
            'DisbursementJwtResolver.disburseJwt... verifiedJwtPayload.tokentype=',
            verifiedJwtPayload.tokentype,
          )
          const verifiedDisburseJwtPayload = new DisburseJwtPayloadType(
            verifiedJwtPayload.sendercommunityuuid as string,
            verifiedJwtPayload.sendergradidoid as string,
            verifiedJwtPayload.recipientcommunityuuid as string,
            verifiedJwtPayload.recipientcommunityname as string,
            verifiedJwtPayload.recipientgradidoid as string,
            verifiedJwtPayload.recipientfirstname as string,
            verifiedJwtPayload.code as string,
            verifiedJwtPayload.amount as string,
            verifiedJwtPayload.memo as string,
            verifiedJwtPayload.validuntil as string,
            verifiedJwtPayload.recipientalias as string,
          )
          logger.debug(
            'DisbursementJwtResolver.disburseJwt... nach verify verifiedDisburseJwtPayload=',
            verifiedDisburseJwtPayload,
          )
          const senderUser = await findUserByIdentifier(
            verifiedDisburseJwtPayload.sendergradidoid,
            homeCommunity?.communityUuid,
          )
          await invokeXComSendCoins(
            homeCommunity,
            verifiedDisburseJwtPayload.recipientcommunityuuid,
            new Decimal(verifiedDisburseJwtPayload.amount),
            verifiedDisburseJwtPayload.memo,
            senderUser,
            verifiedDisburseJwtPayload.recipientgradidoid,
          )
          result.message = 'disburseJwt successful'
          result.accepted = true
          logger.info(result.message)
          return result
        }
      }
    } catch (error) {
      result.message = 'Error in disburseJwt: ' + error
      result.accepted = false
      logger.error(result.message)
      return result
    }
    return result
  }
}
