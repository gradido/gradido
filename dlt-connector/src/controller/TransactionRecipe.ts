import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/proto/3_3/TransactionBody'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'
import { TransactionRecipe as TransactionRecipeEntity } from '@entity/TransactionRecipe'
import { In, IsNull } from 'typeorm'
import { verify } from './GradidoTransaction'
import { Account } from '@entity/Account'
import { confirm as confirmAccount, findAccountByPublicKey } from './Account'
import { confirm as confirmCommunity, getCommunityForUserIdentifier } from './Community'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { SignaturePair } from '@/proto/3_3/SignaturePair'
import { ConfirmedTransaction } from '@entity/ConfirmedTransaction'

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
    recipeEntity.bodyBytes = Buffer.from(transaction.bodyBytes)
    const body = recipe.getBody()
    body.fillTransactionRecipe(recipeEntity)

    const firstSigPair = transaction.getFirstSignature()
    // TODO: adapt if transactions with more than one signatures where added
    if (!firstSigPair || transaction.sigMap.sigPair.length !== 1) {
      throw new LogError("signature count don't like expected")
    }

    // get recipient and signer accounts if not already set
    recipeEntity.signingAccount =
      signingAccount ?? (await findAccountByPublicKey(firstSigPair.pubKey))
    recipeEntity.signature = Buffer.from(firstSigPair.signature)
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

  public async confirm(confirmedAt: Date, iotaTopic: string): Promise<boolean> {
    const body = this.getBody()
    switch (body.getTransactionType()) {
      case TransactionType.GRADIDO_CREATION:
      case TransactionType.GRADIDO_TRANSFER:
        return true
      case TransactionType.COMMUNITY_ROOT:
        return await confirmCommunity(iotaTopic, confirmedAt)
      case TransactionType.REGISTER_ADDRESS:
        if (!body.registerAddress) {
          throw new LogError('missing RegisterAddress in ConfirmedTransaction')
        }
        return await confirmAccount(body.registerAddress, confirmedAt)
      default:
        throw new LogError('not implemented yet')
    }
  }

  public getMessageIdHex(): string | undefined {
    return this.recipeEntity.iotaMessageId?.toString('hex')
  }
}

export const getNextPendingTransaction = async (): Promise<TransactionRecipeEntity | null> => {
  return await TransactionRecipeEntity.findOne({
    where: { iotaMessageId: IsNull() },
    order: { createdAt: 'ASC' },
    relations: { signingAccount: true },
  })
}

export const findBySignature = (signature: Buffer): Promise<TransactionRecipeEntity | null> => {
  return TransactionRecipeEntity.findOneBy({ signature: Buffer.from(signature) })
}

export const findExistingTransactionRecipeAndMissingMessageIds = async (
  messageIDsHex: string[],
): Promise<{
  existingTransactionRecipes: TransactionRecipeEntity[]
  missingMessageIdsHex: string[]
}> => {
  const existingTransactionRecipes = await TransactionRecipeEntity.getRepository()
    .createQueryBuilder('TransactionRecipe')
    .where('HEX(TransactionRecipe.iota_message_id) IN (:...messageIDs)', {
      messageIDs: messageIDsHex,
    })
    .leftJoinAndSelect('TransactionRecipe.confirmedTransaction', 'ConfirmedTransaction')
    .getMany()

  const foundMessageIds = existingTransactionRecipes
    .map((recipe) => recipe.iotaMessageId?.toString('hex'))
    .filter((messageId) => !!messageId)
  // find message ids for which we don't already have a transaction recipe
  const missingMessageIdsHex = messageIDsHex.filter((id: string) => !foundMessageIds.includes(id))
  return { existingTransactionRecipes, missingMessageIdsHex }
}

export const removeConfirmedTransactionRecipes = async (
  transactionRecipes: TransactionRecipeEntity[],
): Promise<TransactionRecipeEntity[]> => {
  const confirmedTransactions = await ConfirmedTransaction.find({
    where: {
      transactionRecipeId: In(
        transactionRecipes.map(
          (transactionRecipe: TransactionRecipeEntity) => transactionRecipe.id,
        ),
      ),
    },
    select: { transactionRecipeId: true },
  })
  const confirmedTransactionRecipeIds = confirmedTransactions.map(
    (confirmedTransaction: ConfirmedTransaction) => confirmedTransaction.transactionRecipeId,
  )
  return transactionRecipes.filter(
    (transactionRecipe: TransactionRecipeEntity) =>
      !confirmedTransactionRecipeIds.includes(transactionRecipe.id),
  )
}
