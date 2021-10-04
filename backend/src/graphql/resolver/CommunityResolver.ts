/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query } from 'type-graphql'
import { Community } from '../model/Community'

@Resolver()
export class CommunityResolver {
  @Query(() => Community)
  async getCommunityInfo(): Promise<Community> {
    return new Community({
      id: 1,
      name: 'Localhost',
      description: 'Locale ',
      location: 'local',
      url: 'www.gradido.net',
      registerUrl: 'http://localhost:3000/vue/register',
    })
  }

  @Query(() => [Community])
  async communities(): Promise<Community[]> {
    const communities: Community[] = []

    communities.push(
      new Community({
        id: 1,
        name: 'Community 1',
        location: 'Ort 1',
        description:
          'description 1 description 1 description 1 description 1 description 1 description 1 description 1 ',
        url: 'http://localhost:3000/vue/',
        registerUrl: 'http://localhost:3000/vue/register',
      }),
      new Community({
        id: 2,
        name: 'Community 2',
        location: 'Ort 2',
        description:
          'description 2 description 2 description 2 description 2 description 2 description 2 description 2 ',
        url: 'https://stage1.gradido.net/vue/',
        registerUrl: 'https://stage1.gradido.net/vue/register',
      }),
      new Community({
        id: 3,
        name: 'Community 3',
        location: 'Ort 3',
        description:
          'description 3 description 3 description 3 description 3 description 3 description 3 description 3 ',
        url: 'https://gdd1.gradido.net/vue/',
        registerUrl: 'https://gdd1.gradido.net/vue/register',
      }),
    )
    return communities
  }
}
