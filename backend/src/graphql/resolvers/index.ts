import { UserResolver } from './UserResolver'
import { BalanceResolver } from './BalanceResolver'
import { GdtResolver } from './GdtResolver'
import { TransactionResolver } from './TransactionResolver'
import { KlicktippResolver } from './KlicktippResolver'
import { NonEmptyArray } from 'type-graphql'

export { UserResolver, BalanceResolver, GdtResolver, TransactionResolver, KlicktippResolver }

// eslint-disable-next-line @typescript-eslint/ban-types
const resolvers = (): NonEmptyArray<Function> => [
  UserResolver,
  BalanceResolver,
  GdtResolver,
  TransactionResolver,
  KlicktippResolver,
]

export default resolvers
