/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Authorized } from 'type-graphql'
import { RIGHTS } from '../../auth/RIGHTS'
import CONFIG from '../../config'
import { Community } from '../model/Community'

@Resolver()
export class CommunityResolver {
  @Authorized([RIGHTS.GET_COMMUNITY_INFO])
  @Query(() => Community)
  async getCommunityInfo(): Promise<Community> {
    return new Community({
      name: CONFIG.COMMUNITY_NAME,
      description: CONFIG.COMMUNITY_DESCRIPTION,
      url: CONFIG.COMMUNITY_URL,
      registerUrl: CONFIG.COMMUNITY_REGISTER_URL,
    })
  }

  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [Community])
  async communities(): Promise<Community[]> {
    if (CONFIG.PRODUCTION)
      return [
        new Community({
          id: 3,
          name: 'Gradido-Akademie',
          description: 'Freies Institut für Wirtschaftsbionik.',
          url: 'https://gradido.net',
          registerUrl: 'https://gdd1.gradido.com/vue/register-community',
        }),
      ]
    return [
      new Community({
        id: 1,
        name: 'Gradido Entwicklung',
        description: 'Die lokale Entwicklungsumgebung von Gradido.',
        url: 'http://localhost/vue/',
        registerUrl: 'http://localhost/vue/register-community',
      }),
      new Community({
        id: 2,
        name: 'Gradido Staging',
        description: 'Der Testserver der Gradido-Akademie.',
        url: 'https://stage1.gradido.net/vue/',
        registerUrl: 'https://stage1.gradido.net/vue/register-community',
      }),
      new Community({
        id: 3,
        name: 'Gradido-Akademie',
        description: 'Freies Institut für Wirtschaftsbionik.',
        url: 'https://gradido.net',
        registerUrl: 'https://gdd1.gradido.com/vue/register-community',
      }),
    ]
  }
}
