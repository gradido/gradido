// AI-GENERATED — not an architecture reference
import { GraphQLScalarType, Kind } from 'graphql'

const INVALID_DATE_STRING = 'Provided date string is invalid and cannot be parsed'

// A string that begins with a calendar date: year, month, day.
const LEADING_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})/

// The last day of a month is day 0 of the month after it.
const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate()

const convertStringToDate = (dateString: string): Date => {
  // `new Date` reads a day the month does not have as a day of the next month -- February 30
  // as March 2 -- so the calendar date a string begins with is checked before it is asked.
  const calendarDate = LEADING_CALENDAR_DATE.exec(dateString)
  if (calendarDate) {
    const [year, month, day] = calendarDate.slice(1).map(Number)
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
      throw new Error(INVALID_DATE_STRING)
    }
  }
  const date = new Date(dateString)
  // `new Date` never throws: what it cannot read becomes an Invalid Date, and that is refused
  // here rather than handed on to a resolver.
  if (Number.isNaN(date.getTime())) {
    throw new Error(INVALID_DATE_STRING)
  }
  return date
}

/**
 * The scalar a `Date` travels as, under the name and with the behaviour type-graphql 1 gave
 * it (its GraphQLISODateTime, copied). type-graphql 2 puts `DateTimeISO` of graphql-scalars
 * in its place: another type name in the schema -- which a client that declares a variable
 * `DateTime` no longer finds, another community's server among them -- and a stricter
 * reading of what a date string may be.
 *
 * One thing differs from the copy: a string that is no date is refused, a day its month does
 * not have included. type-graphql 1 meant to, but caught an exception `new Date` does not
 * throw, and let an Invalid Date through.
 */
export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description:
    'The javascript `Date` as string. Type represents date and time as the ISO Date string.',

  serialize(value: unknown) {
    if (!(value instanceof Date)) {
      throw new Error(`Unable to serialize value '${value}' as it's not an instance of 'Date'`)
    }
    return value.toISOString()
  },

  parseValue(value: unknown) {
    if (typeof value !== 'string') {
      throw new Error(
        `Unable to parse value '${value}' as GraphQLISODateTime scalar supports only string values`,
      )
    }
    return convertStringToDate(value)
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new Error(
        `Unable to parse literal value of kind '${ast.kind}' as GraphQLISODateTime scalar supports only '${Kind.STRING}' ones`,
      )
    }
    return convertStringToDate(ast.value)
  },
})
