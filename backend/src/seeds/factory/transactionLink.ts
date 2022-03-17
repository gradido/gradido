import { ApolloServerTestClient } from 'apollo-server-testing'
import { createTransactionLink } from '@/seeds/graphql/mutations'
import { login } from '@/seeds/graphql/queries'
import { TransactionLinkInterface } from '@/seeds/transactionLink/TransactionLinkInterface'
import { transactionLinkExpireDate } from '@/graphql/resolver/TransactionLinkResolver'
import { TransactionLink } from '@entity/TransactionLink'

export const transactionLinkFactory = async (
  client: ApolloServerTestClient,
  transactionLink: TransactionLinkInterface,
): Promise<void> => {
  const { mutate, query } = client

  // login
  await query({ query: login, variables: { email: transactionLink.email, password: 'Aa12345_' } })

  const variables = {
    amount: transactionLink.amount,
    memo: transactionLink.memo,
  }

  // get the transaction links's id
  const {
    data: {
      createTransactionLink: { id },
    },
  } = await mutate({ mutation: createTransactionLink, variables })

  if (transactionLink.createdAt || transactionLink.deletedAt) {
    const dbTransactionLink = await TransactionLink.findOneOrFail({ id })

    if (transactionLink.createdAt) {
      dbTransactionLink.createdAt = transactionLink.createdAt
      dbTransactionLink.validUntil = transactionLinkExpireDate(transactionLink.createdAt)
      await dbTransactionLink.save()
    }

    if (transactionLink.deletedAt) {
      dbTransactionLink.deletedAt = new Date()
      await dbTransactionLink.save()
    }
  }
}
