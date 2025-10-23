import { GraphQLClient } from 'graphql-request'
import { SignJWT } from 'jose'
import { getLogger, Logger } from 'log4js'
import * as v from 'valibot'
import { CONFIG } from '../../config'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { HieroId, Uuidv4 } from '../../schemas/typeGuard.schema'
import { homeCommunityGraphqlQuery, setHomeCommunityTopicId } from './graphql'
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

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this.logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.BackendClient`)
    this.logger.addContext('url', CONFIG.BACKEND_SERVER_URL)
    this.client = new GraphQLClient(CONFIG.BACKEND_SERVER_URL, {
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
