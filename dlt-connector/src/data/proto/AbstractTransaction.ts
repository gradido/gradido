import { Transaction } from '@entity/Transaction'

export abstract class AbstractTransaction {
  public abstract fillTransactionRecipe(recipe: Transaction): void
}
