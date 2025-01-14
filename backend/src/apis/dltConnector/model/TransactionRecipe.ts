import { TransactionType } from '@dltConnector/enum/TransactionType'

export interface TransactionRecipe {
  createdAt: string
  type: TransactionType
  messageIdHex: string
}
