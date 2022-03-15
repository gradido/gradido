import { ApolloServerTestClient } from 'apollo-server-testing'
import { createTransactionLink } from '@/seeds/graphql/mutations'
import { login } from '@/seeds/graphql/queries'
import { TransactionLinkInterface } from '@/seeds/transactionLink/TransactionLinkInterface'

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

  await mutate({ mutation: createTransactionLink, variables })
}
