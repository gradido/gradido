import { GraphQLClient } from 'graphql-request'
import { SignJWT } from 'jose'
import { getLogger, Logger } from 'log4js'
import * as v from 'valibot'
import { CONFIG } from '../../config'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { HieroId, Uuidv4 } from '../../schemas/typeGuard.schema'
import {
  getAuthorizedCommunities,
  getReachableCommunities,
  homeCommunityGraphqlQuery,
  setHomeCommunityTopicId,
} from './graphql'
import { type Community, communitySchema } from './output.schema'

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
export class BackendClient {
  private static instance: BackendClient
  client: GraphQLClient
  logger: Logger
  urlValue: string

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this.logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.BackendClient`)
    this.urlValue = `http://localhost:${CONFIG.BACKEND_PORT}`
    this.logger.addContext('url', this.urlValue)

    this.client = new GraphQLClient(this.urlValue, {
      headers: {
        'content-type': 'application/json',
      },
      method: 'GET',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
  }

  public get url(): string {
    return this.urlValue
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): BackendClient {
    if (!BackendClient.instance) {
      BackendClient.instance = new BackendClient()
    }
    return BackendClient.instance
  }

  public async getHomeCommunityDraft(): Promise<Community> {
    this.logger.info('check home community on backend')
    const { data, errors } = await this.client.rawRequest<{ homeCommunity: Community }>(
      homeCommunityGraphqlQuery,
      {},
      await this.getRequestHeader(),
    )
    if (errors) {
      throw errors[0]
    }
    return v.parse(communitySchema, data.homeCommunity)
  }

  public async setHomeCommunityTopicId(uuid: Uuidv4, hieroTopicId: HieroId): Promise<Community> {
    this.logger.info('update home community on backend')
    const { data, errors } = await this.client.rawRequest<{ updateHomeCommunity: Community }>(
      setHomeCommunityTopicId,
      { uuid, hieroTopicId },
      await this.getRequestHeader(),
    )
    if (errors) {
      throw errors[0]
    }
    return v.parse(communitySchema, data.updateHomeCommunity)
  }

  public async getReachableCommunities(): Promise<Community[]> {
    this.logger.info('get reachable communities on backend')
    const { data, errors } = await this.client.rawRequest<{ reachableCommunities: Community[] }>(
      getReachableCommunities,
      {},
      await this.getRequestHeader(),
    )
    if (errors) {
      throw errors[0]
    }
    return v.parse(v.array(communitySchema), data.reachableCommunities)
  }

  public async getAuthorizedCommunities(): Promise<Community[]> {
    this.logger.info('get authorized communities on backend')
    const { data, errors } = await this.client.rawRequest<{ authorizedCommunities: Community[] }>(
      getAuthorizedCommunities,
      {},
      await this.getRequestHeader(),
    )
    if (errors) {
      throw errors[0]
    }
    return v.parse(v.array(communitySchema), data.authorizedCommunities)
  }

  private async getRequestHeader(): Promise<{
    authorization: string
  }> {
    return {
      authorization: 'Bearer ' + (await this.createJWTToken()),
    }
  }

  private async createJWTToken(): Promise<string> {
    const secret = new TextEncoder().encode(CONFIG.JWT_SECRET)
    const token = await new SignJWT({ gradidoID: 'dlt-connector', 'urn:gradido:claim': true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('urn:gradido:issuer')
      .setAudience('urn:gradido:audience')
      .setExpirationTime('1m')
      .sign(secret)
    return token
  }
}
