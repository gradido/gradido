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
import { findAccountsByPublicKeys } from './Account'
import { TransactionsManager } from './TransactionsManager'
import { findCommunitiesByTopics } from './Community'
import { Community } from '@entity/Community'

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

  public static async create(
    transaction: GradidoTransaction,
    transactionDraft?: TransactionDraft,
  ): Promise<TransactionRecipe> {
    const recipeEntity = TransactionRecipeEntity.create()
    const recipe = new TransactionRecipe(recipeEntity)
    if (transactionDraft) {
      recipeEntity.backendTransactionId = transactionDraft.backendTransactionId
    }
    recipeEntity.bodyBytes = transaction.bodyBytes
    const body = recipe.getBody()
    body.fillTransactionRecipe(recipeEntity)

    // TODO: adapt if transactions with more than one signatures where added
    if (transaction.sigMap.sigPair.length !== 1) {
      throw new LogError("signature count don't like expected")
    }
    const firstSigPair = transaction.sigMap.sigPair[0]
    recipeEntity.signature = firstSigPair.signature
    // get recipient and signer accounts
    const recipientPublicKey = body.getRecipientPublicKey()
    const publicKeys = [firstSigPair.pubKey]
    if (recipientPublicKey) {
      publicKeys.push(recipientPublicKey)
    }
    // why put them in a array? To reduce db calls
    const accounts = await findAccountsByPublicKeys(publicKeys)
    accounts.forEach((account: Account) => {
      if (account.derive2Pubkey.compare(firstSigPair.pubKey) === 0) {
        recipeEntity.signingAccount = account
      } else if (recipientPublicKey && account.derive2Pubkey.compare(recipientPublicKey) === 0) {
        recipeEntity.recipientAccount = account
      }
    })

    if (transactionDraft) {
      // get recipient and sender community
      const homeCommunityTopic = TransactionsManager.getInstance().getHomeCommunityTopic()
      let senderCommunityTopic = homeCommunityTopic
      if (transactionDraft.senderUser.communityUuid) {
        senderCommunityTopic = iotaTopicFromCommunityUUID(transactionDraft.senderUser.communityUuid)
      }
      let recipientCommunityTopic = homeCommunityTopic
      if (transactionDraft.recipientUser.communityUuid) {
        recipientCommunityTopic = iotaTopicFromCommunityUUID(
          transactionDraft.recipientUser.communityUuid,
        )
      }
      const communities = await findCommunitiesByTopics(
        [senderCommunityTopic, recipientCommunityTopic].filter(
          (value, index, array) => array.indexOf(value) === index,
        ),
      )
      communities.forEach((community: Community) => {
        // sender and recipient community can be the same, therefore no else if
        if (community.iotaTopic === senderCommunityTopic) {
          recipeEntity.senderCommunity = community
        }
        if (community.iotaTopic === recipientCommunityTopic) {
          recipeEntity.recipientCommunity = community
        }
      })

      if (recipeEntity.amount !== transactionDraft.amount) {
        throw new TransactionError(
          TransactionErrorType.LOGIC_ERROR,
          'recipe amount differ from amount in transactionDraft',
        )
      }
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
    transaction.sigMap.sigPair[0].signature = this.recipeEntity.signature
    if (body.communityRoot) {
      const publicKey = this.recipeEntity.senderCommunity.rootPubkey
      if (!publicKey) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing community public key for community root transaction',
        )
      }
      transaction.sigMap.sigPair[0].pubKey = publicKey
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
    where: { iotaMessageId: Not(IsNull()) },
    order: { createdAt: 'ASC' },
  })
}
