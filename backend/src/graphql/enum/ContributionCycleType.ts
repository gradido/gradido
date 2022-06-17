import { registerEnumType } from 'type-graphql'

export enum ContributionCycleType {
  ONCE = 'once',
  HOUR = 'hour',
  TWO_HOURS = 'two_hours',
  FOUR_HOURS = 'four_hours',
  EIGHT_HOURS = 'eight_hours',
  HALF_DAY = 'half_day',
  DAY = 'day',
  TWO_DAYS = 'two_days',
  THREE_DAYS = 'three_days',
  FOUR_DAYS = 'four_days',
  FIVE_DAYS = 'five_days',
  SIX_DAYS = 'six_days',
  WEEK = 'week',
  TWO_WEEKS = 'two_weeks',
  MONTH = 'month',
  TWO_MONTH = 'two_month',
  QUARTER = 'quarter',
  HALF_YEAR = 'half_year',
  YEAR = 'year',
}

registerEnumType(ContributionCycleType, {
  name: 'ContributionCycleType', // this one is mandatory
  description: 'Name of the Type of the ContributionCycle', // this one is optional
})
