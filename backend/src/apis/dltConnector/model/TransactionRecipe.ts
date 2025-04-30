import type { TransactionType } from '@dltConnector/enum/TransactionType'

export interface TransactionRecipe {
  id: number
  createdAt: string
  type: TransactionType
  topic: string
}
