import { DomainError } from 'shared'

export class DBNotFoundError extends DomainError {
  constructor(
    public readonly table: string,
    public readonly where: string,
  ) {
    super(`DB_NOT_FOUND in ${table} where: ${where}`)
  }
}

export class DBDuplicateEntryError extends DomainError {
  constructor(
    public readonly table: string,
    public readonly row: string,
    public readonly value: string,
  ) {
    super(`DB_DUPLICATE_ENTRY in ${table}, unique row: ${row}, existing value: ${value}`)
  }
}

export class DBMissingJoin extends DomainError {
  constructor(
    public readonly table: string,
    public readonly joinTable: string,
    public readonly where: string,
  ) {
    super(`DB_MISSING_JOIN in ${table}, join with ${joinTable}, where ${where}`)
  }
}

export class DBInsertFailed<T> extends DomainError {
  constructor(
    public readonly table: string,
    public readonly row: T,
  ) {
    super(`DB_INSERT_FAILED in ${table}`)
  }
}
