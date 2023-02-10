import { Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { GetTestApiResult } from '../../GetTestApiResult'

@Resolver()
export class Test2Resolver {
  @Query(() => GetTestApiResult)
  async test2(): Promise<GetTestApiResult> {
    logger.info(`test api 2 1_0`)
    return new GetTestApiResult('1_0')
  }
}
