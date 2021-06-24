import { Resolver, Query, Mutation, Arg } from 'type-graphql'
import { Group } from '../models/Group'
import { LoginServerAPI } from '../datasources/loginServer'
@Resolver()
export class UserResolver {
  @Query(() => [Group])
  groups(): Group[] {
    const loginServer = new LoginServerAPI()
    return loginServer.getAllGroupAliases()
  }

  @Query(() => Group)
  group(@Arg('id') id: string): Promise<Group | undefined> {
    return Group.findOne({ where: { id } })
  }

}
