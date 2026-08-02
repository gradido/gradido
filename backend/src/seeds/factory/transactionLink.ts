import {
  type TransactionLinkInterface,
  transactionLinkFactory as transactionLinkFactoryDb,
} from 'database'

export type { TransactionLinkInterface }

export async function transactionLinkFactory(
  _client: any,
  transactionLink: TransactionLinkInterface,
): Promise<void> {
  await transactionLinkFactoryDb(transactionLink)
}
