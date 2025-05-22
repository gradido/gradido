import { backendLogger as logger } from '@/server/logger'
import { CONFIG } from '@/config'
import { Community as DbCommunity } from 'database'
import { Decimal } from 'decimal.js-light'
import { User as dbUser } from 'database'
import { LogError } from '@/server/LogError'
import { getCommunityByIdentifier } from '@/graphql/resolver/util/communities'
import { processXComPendingSendCoins } from './processXComSendCoins'
import { processXComCommittingSendCoins } from './processXComSendCoins'
import { storeForeignUser } from './storeForeignUser'
import { SendCoinsResult } from '@/federation/client/1_0/model/SendCoinsResult'

export async function invokeXComSendCoins(
    homeCom: DbCommunity,
    recipientCommunityIdentifier: string,
    amount: Decimal,
    memo: string,
    senderUser: dbUser,
    recipientIdentifier: string,
) {
    // processing a x-community sendCoins
    logger.debug('X-Com: processing a x-community transaction...')
    if (!CONFIG.FEDERATION_XCOM_SENDCOINS_ENABLED) {
        throw new LogError('X-Community sendCoins disabled per configuration!')
    }
    const recipCom = await getCommunityByIdentifier(recipientCommunityIdentifier)
    logger.debug('recipient commuity: ', recipCom)
    if (recipCom === null) {
        throw new LogError(
            'no recipient commuity found for identifier:',
            recipientCommunityIdentifier,
        )
    }
    if (recipCom !== null && recipCom.authenticatedAt === null) {
        throw new LogError('recipient commuity is connected, but still not authenticated yet!')
    }
    let pendingResult: SendCoinsResult
    let committingResult: SendCoinsResult
    const creationDate = new Date()

    try {
    pendingResult = await processXComPendingSendCoins(
        recipCom,
        homeCom,
        creationDate,
        amount,
        memo,
        senderUser,
        recipientIdentifier,
    )
    logger.debug('processXComPendingSendCoins result: ', pendingResult)
    if (pendingResult.vote && pendingResult.recipGradidoID) {
        logger.debug('vor processXComCommittingSendCoins...')
        committingResult = await processXComCommittingSendCoins(
        recipCom,
        homeCom,
        creationDate,
        amount,
        memo,
        senderUser,
        pendingResult,
        )
        logger.debug('processXComCommittingSendCoins result: ', committingResult)
        if (!committingResult.vote) {
            logger.fatal('FATAL ERROR: on processXComCommittingSendCoins for', committingResult)
            throw new LogError(
                'FATAL ERROR: on processXComCommittingSendCoins with ',
                recipientCommunityIdentifier,
                recipientIdentifier,
                amount.toString(),
                memo,
            )
        }
        // after successful x-com-tx store the recipient as foreign user
        logger.debug('store recipient as foreign user...')
        if (await storeForeignUser(recipCom, committingResult)) {
            logger.info(
                'X-Com: new foreign user inserted successfully...',
                recipCom.communityUuid,
                committingResult.recipGradidoID,
            )
        }
    }
    } catch (err) {
        throw new LogError(
            'ERROR: on processXComCommittingSendCoins with ',
            recipientCommunityIdentifier,
            recipientIdentifier,
            amount.toString(),
            memo,
            err,
        )
    }
}
