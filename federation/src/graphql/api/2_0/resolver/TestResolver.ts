// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { GetTestApiResult } from '../../GetTestApiResult'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class TestResolver {
  @Query(() => GetTestApiResult)
  async test(): Promise<GetTestApiResult> {
    logger.info(`test api 2_0`)
    return new GetTestApiResult('2_0')
  }
}
