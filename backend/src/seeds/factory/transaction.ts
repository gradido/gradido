import { ApolloServerTestClient } from 'apollo-server-testing'
import { login } from '@/seeds/graphql/queries'
import { TransactionInterface } from '@/seeds/transaction/transactionInterface'
import { sendCoins } from '@/seeds/graphql/mutations'
import { Transaction } from '@entity/Transaction'

export const transactionFactory = async (
  client: ApolloServerTestClient,
  transactions: TransactionInterface[],
): Promise<void> => {
  let transaction: any
  for (transaction in transactions) {
    const { mutate, query } = client

    // login
    await query({ query: login, variables: { email: transaction.email, password: 'Aa12345_' } })

    const variables = {
      email: transaction.email,
      amount: transaction.amount,
      memo: transaction.memo,
    }

    const {
      data: {
        createTransaction: { id },
      },
    } = await mutate({ mutation: sendCoins, variables })

    if (transaction.creationDate) {
      const dbTransaction = await Transaction.findOneOrFail({ id })

      if (transaction.creationDate) {
        dbTransaction.creationDate = transaction.creationDate
        await dbTransaction.save()
      }
    }
  }
}
