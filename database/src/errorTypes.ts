import { Domain } from 'domain'
import { DomainError } from 'shared'

export class DBNotFoundError extends DomainError {
  constructor(
    public readonly tableName: string,
    public readonly where: string,
  ) {
    super(`DB_NOT_FOUND in ${tableName} where: ${where}`)
  }
}

export class DBDuplicateEntryError extends DomainError {
  constructor(
    public readonly tableName: string,
    public readonly rowName: string,
    public readonly value: string,
  ) {
    super(`DB_DUPLICATE_ENTRY in ${tableName}, unique row: ${rowName}, existing value: ${value}`)
  }
}

export class DBMissingJoin extends DomainError {
  constructor(
    public readonly tableName: string,
    public readonly joinTableName: string,
    public readonly where: string,
  ) {
    super(`DB_MISSING_JOIN in ${tableName}, join with ${joinTableName}, where ${where}`)
  }
}

export class DBInsertFailed<T> extends DomainError {
  constructor(
    public readonly tableName: string,
    public readonly row: T,
  ) {
    super(`DB_INSERT_FAILED in ${tableName}`)
  }
}
