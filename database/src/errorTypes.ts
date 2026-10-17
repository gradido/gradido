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

/** A unique key refused the row; uniqueKey names which, for a table with more than one. */
export class DBUniqueKeyViolation<K extends string> extends DBDuplicateEntryError {
  constructor(
    table: string,
    public readonly uniqueKey: K,
    value: string,
  ) {
    super(table, uniqueKey, value)
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

/**
 * The driver's code of a failed query ("ER_DATA_TOO_LONG"), or null where it has none: what a
 * log or an answer may carry of such a failure. Not the error itself -- Drizzle writes the
 * parameters of the statement into its message, and where the statement files a picture, the
 * picture is one of them. The same three shapes as isDuplicateEntry reads.
 */
export const driverCodeOfFailedQuery = (error: unknown): string | null => {
  const wrapped =
    (error as {
      code?: string
      cause?: { code?: string }
      driverError?: { code?: string }
    } | null) ?? {}
  return wrapped.cause?.code ?? wrapped.driverError?.code ?? wrapped.code ?? null
}

/**
 * The name of the unique key a duplicate entry violated, or null where the error is none.
 * MariaDB names it in the message: "Duplicate entry '…' for key 'public_key_key'" (MySQL 8
 * puts the table before it: 'communities.public_key_key'). The same three shapes as
 * isDuplicateEntry reads.
 */
export const duplicateEntryKey = (error: unknown): string | null => {
  if (!isDuplicateEntry(error)) {
    return null
  }
  const wrapped =
    (error as {
      sqlMessage?: string
      cause?: { sqlMessage?: string }
      driverError?: { sqlMessage?: string }
    } | null) ?? {}
  const message =
    wrapped.cause?.sqlMessage ?? wrapped.driverError?.sqlMessage ?? wrapped.sqlMessage ?? ''
  return /for key '(?:[^'.]*\.)?([^']+)'$/.exec(message)?.[1] ?? null
}
