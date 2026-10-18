// AI-GENERATED — not an architecture reference
import { is, SQL } from 'drizzle-orm'
import { getTableConfig, MySqlColumn, MySqlDialect, MySqlTable } from 'drizzle-orm/mysql-core'

// What a table is created with when drizzle.schema.ts names no collation for it: the
// default of the database the migrations create (`migration/prepare.ts`).
export const DEFAULT_TABLE_COLLATION = 'utf8mb4_unicode_ci'

const dialect = new MySqlDialect()

// What some columns carry beyond MySqlColumn: the integer ones AUTO_INCREMENT, the string
// ones charset and collation, the date ones ON UPDATE. drizzle-orm keeps the string and date
// base classes (MySqlStringBaseColumn, MySqlDateBaseColumn) out of its exports, so the fields
// are read off the column; on every other column they are undefined.
type ColumnDdlOptions = {
  autoIncrement?: boolean
  charSet?: string
  collation?: string
  hasOnUpdateNow?: boolean
  onUpdateNowFsp?: number
}

const quoteIdentifier = (name: string): string => `\`${name.replaceAll('`', '``')}\``

const quoteColumns = (columns: { name: string }[]): string =>
  columns.map((column) => quoteIdentifier(column.name)).join(', ')

// A default is DDL text, not a bound parameter: CREATE TABLE takes no placeholders.
function sqlText(value: SQL): string {
  const query = dialect.sqlToQuery(value)
  if (query.params.length > 0) {
    throw new Error(`a column default must not carry parameters: ${query.sql}`)
  }
  return query.sql
}

function literal(value: unknown): string {
  if (value === null) {
    return 'NULL'
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString()
  }
  if (typeof value === 'string') {
    return `'${value.replaceAll("'", "''")}'`
  }
  throw new Error(`no DDL literal for a default of type ${typeof value}`)
}

function defaultClause(column: MySqlColumn): string | null {
  if (column.default === undefined) {
    return null
  }
  if (is(column.default, SQL)) {
    return `DEFAULT ${sqlText(column.default)}`
  }
  // Through the column's own conversion, so a custom type (GradidoUnit) is written the way
  // the driver would receive it.
  return `DEFAULT ${literal(column.mapToDriverValue(column.default))}`
}

function columnDefinition(column: MySqlColumn): string {
  const options = column as MySqlColumn & ColumnDdlOptions
  const parts = [quoteIdentifier(column.name), column.getSQLType()]
  if (options.charSet) {
    parts.push(`CHARACTER SET ${options.charSet}`)
  }
  if (options.collation) {
    parts.push(`COLLATE ${options.collation}`)
  }
  if (column.notNull) {
    parts.push('NOT NULL')
  }
  if (options.autoIncrement) {
    parts.push('AUTO_INCREMENT')
  }
  const defaultSql = defaultClause(column)
  if (defaultSql) {
    parts.push(defaultSql)
  }
  if (options.hasOnUpdateNow) {
    parts.push(`ON UPDATE current_timestamp(${options.onUpdateNowFsp ?? ''})`)
  }
  return parts.join(' ')
}

/**
 * The CREATE TABLE statement for one table of drizzle.schema.ts, as the migrations would
 * leave it. Foreign keys and check constraints are refused rather than dropped: the tables
 * have none, and a schema that starts to declare one needs this function extended first.
 */
export function createTableSql(table: MySqlTable, collation = DEFAULT_TABLE_COLLATION): string {
  const config = getTableConfig(table)
  if (config.foreignKeys.length > 0) {
    throw new Error(`${config.name}: foreign keys are not supported by createTableSql`)
  }
  if (config.checks.length > 0) {
    throw new Error(`${config.name}: check constraints are not supported by createTableSql`)
  }

  const lines = config.columns.map(columnDefinition)

  const primary = config.columns.filter((column) => column.primary)
  const primaryKeys = [primary, ...config.primaryKeys.map((key) => key.columns)].filter(
    (columns) => columns.length > 0,
  )
  if (primaryKeys.length > 1) {
    throw new Error(`${config.name}: more than one primary key`)
  }
  if (primaryKeys.length === 1) {
    lines.push(`PRIMARY KEY (${quoteColumns(primaryKeys[0])})`)
  }

  for (const column of config.columns) {
    if (column.isUnique) {
      lines.push(
        `UNIQUE KEY ${quoteIdentifier(column.uniqueName ?? column.name)} (${quoteIdentifier(column.name)})`,
      )
    }
  }
  for (const unique of config.uniqueConstraints) {
    lines.push(`UNIQUE KEY ${quoteIdentifier(unique.getName())} (${quoteColumns(unique.columns)})`)
  }
  for (const index of config.indexes) {
    const columns = index.config.columns.map((column) => {
      if (!is(column, MySqlColumn)) {
        throw new Error(`${config.name}.${index.config.name}: only column indexes are supported`)
      }
      return column
    })
    const kind = index.config.unique ? 'UNIQUE KEY' : 'KEY'
    lines.push(`${kind} ${quoteIdentifier(index.config.name)} (${quoteColumns(columns)})`)
  }

  const charset = collation.split('_')[0]
  return `CREATE TABLE ${quoteIdentifier(config.name)} (\n  ${lines.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=${charset} COLLATE=${collation}`
}
