import { Resolver, Query, Mutation, Arg } from 'type-graphql'
import { Group } from '../models/Group'
import { loginAPI, NetworkInfosResult } from '../../apis/loginAPI'
@Resolver()
export class GroupResolver {
  @Query(() => [Group])
  async groups(): Promise<Group[]> {
    // eslint-disable-next-line no-console
    console.log('group resolver')
    const result: NetworkInfosResult = await loginAPI.getNetworkInfos(['groups'])
    const groups: Group[] = []

    result.data.groups?.forEach((alias: string) => {
      console.log("alias: ", alias)
      const group = new Group()
      group.alias = alias
      groups.push(group)
    })
    return groups
  }

  @Query(() => Group)
  group(@Arg('id') id: string): Promise<Group | undefined> {
    return Group.findOne({ where: { id } })
  }
}
