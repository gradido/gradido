import type { TransactionError } from './TransactionError'
import type { TransactionRecipe } from './TransactionRecipe'

export interface TransactionResult {
  error?: TransactionError
  recipe?: TransactionRecipe
  succeed: boolean
}
