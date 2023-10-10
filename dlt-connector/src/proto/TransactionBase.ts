import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { TransactionRecipe } from '@entity/TransactionRecipe'

export abstract class TransactionBase {
  // validate if transaction is valid, maybe expensive because depending on level several transactions will be fetched from db
  public abstract validate(level: TransactionValidationLevel): boolean

  public abstract fillTransactionRecipe(recipe: TransactionRecipe): void
}
