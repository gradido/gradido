/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query } from 'type-graphql'
import CONFIG from '../../config'
import { Community } from '../models/Community'

@Resolver()
export class CommunityResolver {
  @Query(() => [Community])
  async communities(): Promise<Community[]> {
    const communities = [
      {
        id: 1,
        name: 'Gradido Entwicklung',
        url: 'http://localhost:3000/vue/',
        description: 'Die lokale Entwicklungsumgebung von Gradido.',
        registerUrl: 'http://localhost:3000/vue/register',
      },
      {
        id: 2,
        name: 'Gradido Staging',
        url: 'https://stage1.gradido.net/vue/',
        description: 'Der Testserver der Gradido Akademie.',
        registerUrl: 'https://stage1.gradido.net/vue/register',
      },
      {
        id: 3,
        name: 'Gradido-Akademie',
        url: 'https://gdd1.gradido.com/vue/',
        description: 'Freies Institut für Wirtschaftsbionik.',
        registerUrl: 'https://gdd1.gradido.com/vue/register',
      },
    ]
    return communities.map((el: any) => {
      return new Community(el)
    })
  }

  @Query(() => Community)
  async serverInformation(): Promise<Community> {
    const community = {
      name: CONFIG.COMMUNITY_NAME,
      url: CONFIG.COMMUNITY_URL,
      description: CONFIG.COMMUNITY_DESCRIPTION,
      registerUrl: CONFIG.COMMUNITY_REGISTER_URL,
    }
    return new Community(community)
  }
}
