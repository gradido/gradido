import { Resolver, Query, Arg, Mutation } from 'type-graphql'
import { TransactionDraft } from '@input/TransactionDraft'
import { TransactionResult } from '../model/TransactionResult'
import { TransactionError } from '../model/TransactionError'

@Resolver()
export class TransactionResolver {
  // Why a dummy function?
  // to prevent this error by start:
  //   GeneratingSchemaError: Some errors occurred while generating GraphQL schema:
  //     Type Query must define one or more fields.
  // it seems that at least one query must be defined
  // https://github.com/ardatan/graphql-tools/issues/764
  @Query(() => String)
  version(): string {
    return '0.1'
  }

  @Mutation(() => TransactionResult)
  async sendTransaction(
    @Arg('data')
    transaction: TransactionDraft,
  ): Promise<TransactionResult> {
    try {
      logger.info('sendTransaction call', transaction)
      const signingAccount = await findAccountByUserIdentifier(transaction.senderUser)
      if (!signingAccount) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found sender user account in db",
        )
      }
      logger.info('signing account', signingAccount)

      const recipientAccount = await findAccountByUserIdentifier(transaction.recipientUser)
      if (!recipientAccount) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found recipient user account in db",
        )
      }
      logger.info('recipient account', recipientAccount)

      const body = createTransactionBody(transaction, signingAccount, recipientAccount)
      logger.info('body', body)
      const gradidoTransaction = createGradidoTransaction(body)

      const signingKeyPair = getKeyPair(signingAccount)
      if (!signingKeyPair) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found signing key pair",
        )
      }
      logger.info('key pair for signing', signingKeyPair)

      KeyManager.getInstance().sign(gradidoTransaction, [signingKeyPair])
      const recipeTransactionController = await TransactionRecipe.create({
        transaction: gradidoTransaction,
        senderUser: transaction.senderUser,
        recipientUser: transaction.recipientUser,
        signingAccount,
        recipientAccount,
        backendTransactionId: transaction.backendTransactionId,
      })
      try {
        await recipeTransactionController.getTransactionRecipeEntity().save()
        ConditionalSleepManager.getInstance().signal(TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY' && body.type === CrossGroupType.LOCAL) {
          const existingRecipe = await findBySignature(
            gradidoTransaction.sigMap.sigPair[0].signature,
          )
          if (!existingRecipe) {
            throw new TransactionError(
              TransactionErrorType.LOGIC_ERROR,
              "recipe cannot be added because signature exist but couldn't load this existing receipt",
            )
          }
          return new TransactionResult(new TransactionRecipeOutput(existingRecipe))
        } else {
          throw error
        }
      }
      return new TransactionResult()
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }
}
