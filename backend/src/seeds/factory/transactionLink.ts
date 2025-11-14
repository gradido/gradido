import { ApolloServerTestClient } from 'apollo-server-testing'
import { TransactionLink } from 'database'

import { transactionLinkExpireDate } from '@/graphql/resolver/TransactionLinkResolver'
import { createTransactionLink, login } from '@/seeds/graphql/mutations'
import { TransactionLinkInterface } from '@/seeds/transactionLink/TransactionLinkInterface'

export const transactionLinkFactory = async (
  client: ApolloServerTestClient,
  transactionLink: TransactionLinkInterface,
): Promise<void> => {
  const { mutate } = client

  // login
  await mutate({
    mutation: login,
    variables: { email: transactionLink.email, password: 'Aa12345_' },
  })

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
    const dbTransactionLink = await TransactionLink.findOneOrFail({ where: { id } })

    if (transactionLink.createdAt) {
      dbTransactionLink.createdAt = transactionLink.createdAt
      dbTransactionLink.validUntil = transactionLinkExpireDate(transactionLink.createdAt)
      await dbTransactionLink.save()
    }

    if (transactionLink.deletedAt) {
      dbTransactionLink.deletedAt = new Date(dbTransactionLink.createdAt.getTime() + 1000)
      await dbTransactionLink.save()
    }
  }
}
