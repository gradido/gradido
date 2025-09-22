import { fullName } from '@/graphql/util/fullName'
import { LogError } from '@/server/LogError'
import {
  Community as DbCommunity,
  PendingTransaction as DbPendingTransaction,
  PendingTransactionLoggingView,
  findUserByIdentifier
} from 'database'
import Decimal from 'decimal.js-light'
import { getLogger } from 'log4js'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { encryptAndSign, PendingTransactionState, verifyAndDecrypt } from 'shared'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { SendCoinsArgsLoggingView } from '../logger/SendCoinsArgsLogging.view'
import { SendCoinsArgs } from '../model/SendCoinsArgs'
import { SendCoinsResponseJwtPayloadType } from 'shared'
import { calculateRecipientBalance } from '../util/calculateRecipientBalance'
// import { checkTradingLevel } from '@/graphql/util/checkTradingLevel'
import { revertSettledReceiveTransaction } from '../util/revertSettledReceiveTransaction'
import { settlePendingReceiveTransaction } from '../util/settlePendingReceiveTransaction'
import { storeForeignUser } from '../util/storeForeignUser'
import { countOpenPendingTransactions } from 'database'
import { EncryptedTransferArgs } from 'core'
import { interpretEncryptedTransferArgs } from 'core'
import { SendCoinsJwtPayloadType } from 'shared'
const createLogger = (method: string) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.SendCoinsResolver.${method}`)

@Resolver()
export class SendCoinsResolver {
  @Mutation(() => String)
  async voteForSendCoins(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<string> {
    const methodLogger = createLogger(`voteForSendCoins`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`voteForSendCoins() via apiVersion=1_0 ...`, args)
    }
    const authArgs = await interpretEncryptedTransferArgs(args) as SendCoinsJwtPayloadType
    if (!authArgs) {
      const errmsg = `invalid authentication payload of requesting community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`voteForSendCoins() via apiVersion=1_0 ...`, authArgs)
    }
    // first check if receiver community is correct
    const recipientCom = await DbCommunity.findOneBy({
      communityUuid: authArgs.recipientCommunityUuid,
    })
    if (!recipientCom) {
      const errmsg = `voteForSendCoins with wrong recipientCommunityUuid: ${authArgs.recipientCommunityUuid}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    const senderCom = await DbCommunity.findOneBy({
      communityUuid: authArgs.senderCommunityUuid,
    })
    if (!senderCom) {
      const errmsg = `voteForSendCoins with wrong senderCommunityUuid: ${authArgs.senderCommunityUuid}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    let receiverUser
    
    // second check if receiver user exists in this community
    receiverUser = await findUserByIdentifier(
      authArgs.recipientUserIdentifier,
      authArgs.recipientCommunityUuid,
    )
    if (!receiverUser) {
      const errmsg = `voteForSendCoins with unknown recipientUserIdentifier in the community=` + recipientCom.name
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
 
    if (await countOpenPendingTransactions([authArgs.senderUserUuid, receiverUser.gradidoID]) > 0) {
      const errmsg = `There exist still ongoing 'Pending-Transactions' for the involved users on receiver-side!`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }

    try {
      const txDate = new Date(authArgs.creationDate)
      const receiveBalance = await calculateRecipientBalance(receiverUser.id, authArgs.amount, txDate)
      const pendingTx = DbPendingTransaction.create()
      pendingTx.amount = authArgs.amount
      pendingTx.balance = receiveBalance ? receiveBalance.balance : authArgs.amount
      pendingTx.balanceDate = txDate
      pendingTx.decay = receiveBalance ? receiveBalance.decay.decay : new Decimal(0)
      pendingTx.decayStart = receiveBalance ? receiveBalance.decay.start : null
      pendingTx.creationDate = new Date()
      pendingTx.linkedUserCommunityUuid = authArgs.senderCommunityUuid
      pendingTx.linkedUserGradidoID = authArgs.senderUserUuid
      pendingTx.linkedUserName = authArgs.senderUserName
      pendingTx.memo = authArgs.memo
      pendingTx.previous = receiveBalance ? receiveBalance.lastTransactionId : null
      pendingTx.state = PendingTransactionState.NEW
      pendingTx.typeId = TransactionTypeId.RECEIVE
      pendingTx.userId = receiverUser.id
      pendingTx.userCommunityUuid = authArgs.recipientCommunityUuid
      pendingTx.userGradidoID = receiverUser.gradidoID
      pendingTx.userName = fullName(receiverUser.firstName, receiverUser.lastName)
      pendingTx.transactionLinkId = authArgs.transactionLinkId

      await DbPendingTransaction.insert(pendingTx)
      const responseArgs = new SendCoinsResponseJwtPayloadType(
        authArgs.handshakeID,
        true,
        receiverUser.gradidoID,
        receiverUser.firstName,
        receiverUser.lastName,
        receiverUser.alias,
      )
      const responseJwt = await encryptAndSign(responseArgs, recipientCom.privateJwtKey!, senderCom.publicJwtKey!)
      methodLogger.debug(`voteForSendCoins()-1_0... successfull`)
      return responseJwt
    } catch (err) {
      const errmsg = `Error in voteForSendCoins: ` + err
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
  }

  @Mutation(() => Boolean)
  async revertSendCoins(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    const methodLogger = createLogger(`revertSendCoins`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`revertSendCoins() via apiVersion=1_0 ...`)
    }
    const authArgs = await interpretEncryptedTransferArgs(args) as SendCoinsJwtPayloadType
    if (!authArgs) {
      const errmsg = `invalid revertSendCoins payload of requesting community with publicKey=${args.publicKey}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`revertSendCoins() via apiVersion=1_0 ...`, authArgs)
    }
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: authArgs.recipientCommunityUuid,
    })
    if (!homeCom) {
      const errmsg = `revertSendCoins with wrong recipientCommunityUuid=${authArgs.recipientCommunityUuid}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    let receiverUser
    
    // second check if receiver user exists in this community
    receiverUser = await findUserByIdentifier(authArgs.recipientUserIdentifier)
    if (!receiverUser) {
      const errmsg = `revertSendCoins with unknown recipientUserIdentifier in the community=${homeCom.name}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    try {
      const pendingTx = await DbPendingTransaction.findOneBy({
        userCommunityUuid: authArgs.recipientCommunityUuid,
        userGradidoID: receiverUser.gradidoID,
        state: PendingTransactionState.NEW,
        typeId: TransactionTypeId.RECEIVE,
        balanceDate: new Date(authArgs.creationDate),
        linkedUserCommunityUuid: authArgs.senderCommunityUuid,
        linkedUserGradidoID: authArgs.senderUserUuid,
      })
      if(methodLogger.isDebugEnabled()) {
        methodLogger.debug(
          'XCom: revertSendCoins found pendingTX=',
          pendingTx ? new PendingTransactionLoggingView(pendingTx) : 'null',
        )
      }
      if (pendingTx && pendingTx.amount.toString() === authArgs.amount.toString()) {
        methodLogger.debug('XCom: revertSendCoins matching pendingTX for remove...')
        try {
          await pendingTx.remove()
          methodLogger.debug('XCom: revertSendCoins pendingTX for remove successfully')
        } catch (err) {
          const errmsg = `Error in revertSendCoins on removing pendingTx of receiver: ` + err
          methodLogger.error(errmsg)
          throw new Error(errmsg)
        }
      } else {
        methodLogger.debug(
          'XCom: revertSendCoins NOT matching pendingTX for remove:',
          pendingTx?.amount.toString(),
          authArgs.amount.toString(),
        )
        const errmsg = `Can't find in revertSendCoins the pending receiver TX for ` + {
          args: new SendCoinsArgsLoggingView(authArgs),
          pendingTransactionState: PendingTransactionState.NEW,
          transactionType: TransactionTypeId.RECEIVE,
        }
        methodLogger.error(errmsg)
        throw new Error(errmsg)
      }
      methodLogger.debug(`revertSendCoins()-1_0... successfull`)
      return true
    } catch (err) {
      const errmsg = `Error in revertSendCoins: ` + err
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
  }

  @Mutation(() => Boolean)
  async settleSendCoins(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    const methodLogger = createLogger(`settleSendCoins`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`settleSendCoins() via apiVersion=1_0 ...`, args)
    }
    const authArgs = await interpretEncryptedTransferArgs(args) as SendCoinsJwtPayloadType
    if (!authArgs) {
      const errmsg = `invalid settleSendCoins payload of requesting community with publicKey=${args.publicKey}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`settleSendCoins() via apiVersion=1_0 ...`, authArgs)
    }
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: authArgs.recipientCommunityUuid,
    })
    if (!homeCom) {
      const errmsg = `settleSendCoins with wrong recipientCommunityUuid=${authArgs.recipientCommunityUuid}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
   
    // second check if receiver user exists in this community
    const receiverUser = await findUserByIdentifier(authArgs.recipientUserIdentifier)
    if (!receiverUser) {
      const errmsg = `settleSendCoins with unknown recipientUserIdentifier in the community=${homeCom.name}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: authArgs.recipientCommunityUuid,
      userGradidoID: receiverUser.gradidoID,
      state: PendingTransactionState.NEW,
      typeId: TransactionTypeId.RECEIVE,
      balanceDate: new Date(authArgs.creationDate),
      linkedUserCommunityUuid: authArgs.senderCommunityUuid,
      linkedUserGradidoID: authArgs.senderUserUuid,
    })
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(
        'XCom: settleSendCoins found pendingTX=',
        pendingTx ? new PendingTransactionLoggingView(pendingTx) : 'null',
      )
    }
    if (
      pendingTx &&
      pendingTx.amount.toString() === authArgs.amount.toString() &&
      pendingTx.memo === authArgs.memo
    ) {
      methodLogger.debug('XCom: settleSendCoins matching pendingTX for settlement...')

      await settlePendingReceiveTransaction(homeCom, receiverUser, pendingTx)
      // after successful x-com-tx store the recipient as foreign user
      methodLogger.debug('store recipient as foreign user...')
      if (await storeForeignUser(authArgs)) {
        methodLogger.info(
          'X-Com: new foreign user inserted successfully...',
          authArgs.senderCommunityUuid,
          authArgs.senderUserUuid,
        )
      }

      methodLogger.debug(`XCom: settlePendingReceiveTransaction()-1_0... successful`)
      return true
    } else {
      methodLogger.debug('XCom: settlePendingReceiveTransaction NOT matching pendingTX for settlement...')
      const errmsg = `Can't find in settlePendingReceiveTransaction the pending receiver TX for ` + {
        args: new SendCoinsArgsLoggingView(authArgs),
        pendingTransactionState: PendingTransactionState.NEW,
          transactionTypeId: TransactionTypeId.RECEIVE,
        }
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
  }

  @Mutation(() => Boolean)
  async revertSettledSendCoins(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    const methodLogger = createLogger(`revertSettledSendCoins`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`revertSettledSendCoins() via apiVersion=1_0 ...`)
    }
    const authArgs = await interpretEncryptedTransferArgs(args) as SendCoinsJwtPayloadType
    if (!authArgs) {
      const errmsg = `invalid revertSettledSendCoins payload of requesting community with publicKey=${args.publicKey}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`revertSettledSendCoins() via apiVersion=1_0 ...`, authArgs)
    }
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: authArgs.recipientCommunityUuid,
    })
    if (!homeCom) {
      const errmsg = `revertSettledSendCoins with wrong recipientCommunityUuid=${authArgs.recipientCommunityUuid}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }    
    
    // second check if receiver user exists in this community
    const receiverUser = await findUserByIdentifier(authArgs.recipientUserIdentifier)
    if (!receiverUser) {
      const errmsg = `revertSettledSendCoins with unknown recipientUserIdentifier in the community=${homeCom.name}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: authArgs.recipientCommunityUuid,
      userGradidoID: authArgs.recipientUserIdentifier,
      state: PendingTransactionState.SETTLED,
      typeId: TransactionTypeId.RECEIVE,
      balanceDate: new Date(authArgs.creationDate),
      linkedUserCommunityUuid: authArgs.senderCommunityUuid,
      linkedUserGradidoID: authArgs.senderUserUuid,
    })
    methodLogger.debug(
      'XCom: revertSettledSendCoins found pendingTX=',
      pendingTx ? new PendingTransactionLoggingView(pendingTx) : 'null',
    )
    if (
      pendingTx &&
      pendingTx.amount.toString() === authArgs.amount.toString() &&
      pendingTx.memo === authArgs.memo
    ) {
      methodLogger.debug('XCom: revertSettledSendCoins matching pendingTX for remove...')
      try {
        await revertSettledReceiveTransaction(homeCom, receiverUser, pendingTx)
        methodLogger.debug('XCom: revertSettledSendCoins pendingTX successfully')
      } catch (err) {
        const errmsg = `Error in revertSettledSendCoins of receiver: ` + err
        methodLogger.error(errmsg)
        throw new Error(errmsg)
      }
    } else {
      methodLogger.debug('XCom: revertSettledSendCoins NOT matching pendingTX...')
      const errmsg = `Can't find in revertSettledSendCoins the pending receiver TX for ` + {
        args: new SendCoinsArgsLoggingView(authArgs),
        pendingTransactionState: PendingTransactionState.SETTLED,
        transactionTypeId: TransactionTypeId.RECEIVE,
      }
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    methodLogger.debug(`revertSettledSendCoins()-1_0... successfull`)
    return true
  }
}
