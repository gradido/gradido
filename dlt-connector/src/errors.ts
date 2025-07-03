import { TransactionIdentifier } from './schemas/transaction.schema'
import { IdentifierAccount } from './schemas/account.schema'

export class GradidoNodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GradidoNodeError'
  }
}

export class GradidoNodeMissingTransactionError extends GradidoNodeError {
  public transactionIdentifier?: TransactionIdentifier
  constructor(message: string, transactionIdentifier?: TransactionIdentifier) {
    super(message)
    this.name = 'GradidoNodeMissingTransactionError'
    this.transactionIdentifier = transactionIdentifier
  }
}

export class GradidoNodeMissingUserError extends GradidoNodeError {
  public userIdentifier?: IdentifierAccount
  constructor(message: string, userIdentifier?: IdentifierAccount) {
    super(message)
    this.name = 'GradidoNodeMissingUserError'
    this.userIdentifier = userIdentifier
  }
}

export class GradidoNodeInvalidTransactionError extends GradidoNodeError {
  public transactionIdentifier?: TransactionIdentifier
  constructor(message: string, transactionIdentifier?: TransactionIdentifier) {
    super(message)
    this.name = 'GradidoNodeInvalidTransactionError'
    this.transactionIdentifier = transactionIdentifier
  }
}

export class ParameterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParameterError'
  }
}
