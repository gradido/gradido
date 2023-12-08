import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { In, IsNull } from 'typeorm'

import { AccountRepository } from '@/data/Account.repository'
import { CommunityRepository } from '@/data/Community.repository'
import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { SignaturePair } from '@/data/proto/3_3/SignaturePair'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'

import { verify } from './GradidoTransaction'

interface CreateTransactionRecipeOptions {
  transaction: GradidoTransaction
  senderUser?: UserIdentifier
  recipientUser?: UserIdentifier
  signingAccount?: Account
  recipientAccount?: Account
  backendTransactionId?: number
}

export class TransactionRecipe {
  private body: TransactionBody | undefined = undefined

  // eslint-disable-next-line no-useless-constructor
  public constructor(private recipeEntity: Transaction) {}

  public getBody(): TransactionBody {
    if (!this.body) {
      try {
        this.body = TransactionBody.decode(new Uint8Array(this.recipeEntity.bodyBytes))
      } catch (error) {
        logger.error('error decoding body from gradido transaction: %s', error)
        throw new TransactionError(
          TransactionErrorType.PROTO_DECODE_ERROR,
          'cannot decode body from gradido transaction',
        )
      }
    }
    return this.body
  }

  public getTransactionRecipeEntity(): Transaction {
    return this.recipeEntity
  }

  public static async create({
    transaction,
    senderUser,
    recipientUser,
    signingAccount,
    recipientAccount,
    backendTransactionId,
  }: CreateTransactionRecipeOptions): Promise<TransactionRecipe> {
    const recipeEntity = Transaction.create()
    const recipe = new TransactionRecipe(recipeEntity)
    if (backendTransactionId) {
      recipeEntity.backendTransactionId = backendTransactionId
    }
    recipeEntity.bodyBytes = Buffer.from(transaction.bodyBytes)
    const body = recipe.getBody()
    body.fillTransactionRecipe(recipeEntity)

    const firstSigPair = transaction.getFirstSignature()
    // TODO: adapt if transactions with more than one signatures where added

    // get recipient and signer accounts if not already set
    recipeEntity.signingAccount =
      signingAccount ?? (await AccountRepository.findByPublicKey(firstSigPair.pubKey))
    recipeEntity.signature = Buffer.from(firstSigPair.signature)
    recipeEntity.recipientAccount =
      recipientAccount ?? (await AccountRepository.findByPublicKey(body.getRecipientPublicKey()))

    if (senderUser) {
      // get recipient and sender community
      const senderCommunity = await CommunityRepository.getCommunityForUserIdentifier(senderUser)
      if (!senderCommunity) {
        throw new LogError("couldn't find sender community for transaction")
      }
      recipeEntity.senderCommunity = senderCommunity
    }
    if (recipientUser) {
      recipeEntity.recipientCommunity = await CommunityRepository.getCommunityForUserIdentifier(
        recipientUser,
      )
    }

    return recipe
  }

  public getGradidoTransaction(): { transaction: GradidoTransaction; body: TransactionBody } {
    const body = this.getBody()
    const transaction = new GradidoTransaction(body)
    if (!this.recipeEntity.signature) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'missing signature in transaction recipe',
      )
    }
    const signaturePair = new SignaturePair()
    if (this.recipeEntity.signature.length !== 64) {
      throw new TransactionError(TransactionErrorType.INVALID_SIGNATURE, "signature isn't 64 bytes")
    }
    signaturePair.signature = this.recipeEntity.signature
    if (body.communityRoot) {
      const publicKey = this.recipeEntity.senderCommunity.rootPubkey
      if (!publicKey) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing community public key for community root transaction',
        )
      }
      signaturePair.pubKey = publicKey
    } else if (this.recipeEntity.signingAccount) {
      const publicKey = this.recipeEntity.signingAccount.derive2Pubkey
      if (!publicKey) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing signing account public key for transaction',
        )
      }
      signaturePair.pubKey = publicKey
    } else {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "signingAccount not exist and it isn't a community root transaction",
      )
    }
    if (signaturePair.validate()) {
      transaction.sigMap.sigPair.push(signaturePair)
    }
    if (!verify(transaction)) {
      throw new TransactionError(TransactionErrorType.INVALID_SIGNATURE, 'signature is invalid')
    }
    transaction.parentMessageId = this.recipeEntity.iotaMessageId
    return { transaction, body }
  }

  public getBalanceAccount(): Account | undefined | null {
    const body = this.getBody()
    switch (body.getTransactionType()) {
      case TransactionType.GRADIDO_CREATION:
        return this.recipeEntity.recipientAccount
      case TransactionType.GRADIDO_TRANSFER:
      case TransactionType.GRADIDO_DEFERRED_TRANSFER:
        return this.recipeEntity.signingAccount
      case TransactionType.REGISTER_ADDRESS:
      case TransactionType.COMMUNITY_ROOT:
      case TransactionType.GROUP_FRIENDS_UPDATE:
        return null
    }
  }

  public getMessageIdHex(): string | undefined {
    return this.recipeEntity.iotaMessageId?.toString('hex')
  }
}

export const getNextPendingTransaction = async (): Promise<Transaction | null> => {
  return await Transaction.findOne({
    where: { iotaMessageId: IsNull() },
    order: { createdAt: 'ASC' },
    relations: { signingAccount: true },
  })
}

export const findBySignature = (signature: Buffer): Promise<Transaction | null> => {
  return Transaction.findOneBy({ signature: Buffer.from(signature) })
}

export const findByMessageId = (iotaMessageId: string): Promise<Transaction | null> => {
  return Transaction.findOneBy({ iotaMessageId: Buffer.from(iotaMessageId, 'hex') })
}

export const findExistingTransactionRecipeAndMissingMessageIds = async (
  messageIDsHex: string[],
): Promise<{
  existingTransactionRecipes: Transaction[]
  missingMessageIdsHex: string[]
}> => {
  const existingTransactionRecipes = await Transaction.getRepository()
    .createQueryBuilder('TransactionRecipe')
    .where('HEX(TransactionRecipe.iota_message_id) IN (:...messageIDs)', {
      messageIDs: messageIDsHex,
    })
    .leftJoinAndSelect('TransactionRecipe.confirmedTransaction', 'ConfirmedTransaction')
    .leftJoinAndSelect('TransactionRecipe.recipientAccount', 'RecipientAccount')
    .leftJoinAndSelect('RecipientAccount.user', 'RecipientUser')
    .leftJoinAndSelect('TransactionRecipe.signingAccount', 'SigningAccount')
    .leftJoinAndSelect('SigningAccount.user', 'SigningUser')
    .getMany()

  const foundMessageIds = existingTransactionRecipes
    .map((recipe: Transaction) => recipe.iotaMessageId?.toString('hex'))
    .filter((messageId) => !!messageId)
  // find message ids for which we don't already have a transaction recipe
  const missingMessageIdsHex = messageIDsHex.filter((id: string) => !foundMessageIds.includes(id))
  return { existingTransactionRecipes, missingMessageIdsHex }
}

export const removeConfirmedTransactionRecipes = (transactions: Transaction[]): Transaction[] => {
  return transactions.filter(
    (transaction: Transaction) =>
      transaction.runningHash === undefined || transaction.runningHash.length === 0,
  )
}
