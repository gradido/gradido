import { Field, ObjectType, Query, Resolver } from 'type-graphql'
import { backendLogger as logger } from '@/server/logger'

@ObjectType()
class GetTestApiResult {
  constructor(apiVersion: string) {
    this.api = `${apiVersion}`
  }

  @Field(() => String)
  api: string
}

@Resolver()
export class  TestResolver {
  @Query(() => GetTestApiResult)
  async test(): Promise<GetTestApiResult> {
    logger.info(`test api 2_0`)
    return new GetTestApiResult("2_0")
  }
}

