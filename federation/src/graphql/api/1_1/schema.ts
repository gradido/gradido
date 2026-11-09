import { NonEmptyArray } from 'type-graphql'
import { AliveResolver } from '../1_0/resolver/AliveResolver'
import { CommandResolver } from '../1_0/resolver/CommandResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [AliveResolver, CommandResolver]
}
