import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/proto/3_3/TransactionBody'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'
import { TransactionRecipe as TransactionRecipeEntity } from '@entity/TransactionRecipe'
import { IsNull, Not } from 'typeorm'
import { verify } from './GradidoTransaction'
import { Account } from '@entity/Account'
import { findAccountByPublicKey, findAccountsByPublicKeys } from './Account'
import { TransactionsManager } from './TransactionsManager'
import { findCommunitiesByTopics, getCommunityForUserIdentifier } from './Community'
import { Community } from '@entity/Community'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { User } from '@entity/User'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { SignaturePair } from '@/proto/3_3/SignaturePair'

interface CreateTransactionRecipeOptions {
  transaction: GradidoTransaction
  senderUser?: UserIdentifier
  recipientUser?: UserIdentifier
  signingAccount?: Account
  recipientAccount?: Account
  backendTransactionId?: number
}

export class TransactionRecipe {
  private recipeEntity: TransactionRecipeEntity
  private body: TransactionBody | undefined = undefined

  public constructor(recipe: TransactionRecipeEntity) {
    this.recipeEntity = recipe
  }

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

  public getTransactionRecipeEntity(): TransactionRecipeEntity {
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
    const recipeEntity = TransactionRecipeEntity.create()
    const recipe = new TransactionRecipe(recipeEntity)
    if (backendTransactionId) {
      recipeEntity.backendTransactionId = backendTransactionId
    }
    recipeEntity.bodyBytes = transaction.bodyBytes
    const body = recipe.getBody()
    body.fillTransactionRecipe(recipeEntity)

    // TODO: adapt if transactions with more than one signatures where added
    if (transaction.sigMap.sigPair.length !== 1) {
      throw new LogError("signature count don't like expected")
    }
    const firstSigPair = transaction.sigMap.sigPair[0]

    // get recipient and signer accounts if not already set
    recipeEntity.signingAccount =
      signingAccount ?? (await findAccountByPublicKey(firstSigPair.pubKey))
    recipeEntity.signature = firstSigPair.signature
    recipeEntity.recipientAccount =
      recipientAccount ?? (await findAccountByPublicKey(body.getRecipientPublicKey()))

    if (senderUser) {
      // get recipient and sender community
      const senderCommunity = await getCommunityForUserIdentifier(senderUser)
      if (!senderCommunity) {
        throw new LogError("couldn't find sender community for transaction")
      }
      recipeEntity.senderCommunity = senderCommunity
    }
    if (recipientUser) {
      recipeEntity.recipientCommunity = await getCommunityForUserIdentifier(recipientUser)
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
      transaction.sigMap.sigPair.push(signaturePair)
    } else {
      throw new TransactionError(
        TransactionErrorType.NOT_IMPLEMENTED_YET,
        'not implented yet getting public key from another transaction type as community root',
      )
    }
    if (!verify(transaction)) {
      throw new TransactionError(TransactionErrorType.INVALID_SIGNATURE, 'signature is invalid')
    }
    transaction.parentMessageId = this.recipeEntity.paringTransactionRecipe?.iotaMessageId
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
}

export const getNextPendingTransaction = async (): Promise<TransactionRecipeEntity | null> => {
  return await TransactionRecipeEntity.findOne({
    where: { iotaMessageId: IsNull() },
    order: { createdAt: 'ASC' },
  })
}

export const findBySignature = (signature: Buffer): Promise<TransactionRecipeEntity | null> => {
  return TransactionRecipeEntity.findOneBy({ signature })
}
