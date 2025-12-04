import { 
  transactionLinkFactory as transactionLinkFactoryDb, 
  TransactionLinkInterface 
} from 'database'

export { TransactionLinkInterface }

export async function transactionLinkFactory (
  _client: any,
  transactionLink: TransactionLinkInterface,
): Promise<void> {
  await transactionLinkFactoryDb(transactionLink)
}
