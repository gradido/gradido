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

/**
 * Whether a driver error is a unique-key violation. TypeORM hands the driver error on as
 * `driverError`, drizzle wraps it in a DrizzleQueryError with the original as `cause`, and
 * a bare mysql2 error carries the code itself - one question, three shapes.
 */
export const isDuplicateEntry = (error: unknown): boolean => {
  const wrapped =
    (error as {
      code?: string
      cause?: { code?: string }
      driverError?: { code?: string }
    } | null) ?? {}
  return (
    wrapped.code === 'ER_DUP_ENTRY' ||
    wrapped.cause?.code === 'ER_DUP_ENTRY' ||
    wrapped.driverError?.code === 'ER_DUP_ENTRY'
  )
}
