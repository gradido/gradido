import { TransactionError } from './TransactionError'
import { TransactionRecipe } from './TransactionRecipe'

export interface TransactionResult {
  error?: TransactionError
  recipe?: TransactionRecipe
  succeed: boolean
}
