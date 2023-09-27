import { Resolver, Query, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { create as createTransactionBody } from '@controller/TransactionBody'
import { create as createGradidoTransaction } from '@controller/GradidoTransaction'

import { TransactionResult } from '../model/TransactionResult'
import { TransactionError } from '../model/TransactionError'
import { TransactionRecipe, findBySignature } from '@/controller/TransactionRecipe'
import { TransactionRecipe as TransactionRecipeOutput } from '@model/TransactionRecipe'
import { KeyManager } from '@/controller/KeyManager'
import { findAccountByUserIdentifier, getKeyPair } from '@/controller/Account'
import { TransactionErrorType } from '../enum/TransactionErrorType'
import { CrossGroupType } from '@/proto/3_3/enum/CrossGroupType'

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
      const signingAccount = await findAccountByUserIdentifier(transaction.senderUser)
      if (!signingAccount) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found sender user account in db",
        )
      }
      const recipientAccount = await findAccountByUserIdentifier(transaction.recipientUser)
      if (!recipientAccount) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found recipient user account in db",
        )
      }
      const body = createTransactionBody(transaction, signingAccount, recipientAccount)
      const gradidoTransaction = createGradidoTransaction(body)

      const signingKeyPair = getKeyPair(signingAccount)
      if (!signingKeyPair) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found signing key pair",
        )
      }
      KeyManager.getInstance().sign(gradidoTransaction, [signingKeyPair])
      const recipeTransactionController = await TransactionRecipe.create(
        gradidoTransaction,
        transaction,
        signingAccount,
        recipientAccount,
      )
      try {
        await recipeTransactionController.getTransactionRecipeEntity().save()
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
