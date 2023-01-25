import { Field, ObjectType, Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { GetTestApiResult } from '../../GetTestApiResult'

@Resolver()
export class TestResolver {
  @Query(() => GetTestApiResult)
  async test(): Promise<GetTestApiResult> {
    logger.info(`test api 1_0`);
    return new GetTestApiResult("1_0");
  }
}
