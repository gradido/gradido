import { Field, ObjectType, Query, Resolver } from 'type-graphql'
import { backendLogger as logger } from '@/server/logger'

/*

@ObjectType()
export class GetTestApiResult {
  constructor(apiVersion: string) {
    this.api = `test ${apiVersion}`
  }

  @Field(() => String)
  api: string
}

export class TestResolver {
  @Query(() => GetTestApiResult)
  async test(): Promise<String> {
    const api = `1_0`
    logger.info(`test apiVersion=1_0`)
    return new GetTestApiResult(api)
  }
}

import gql from 'graphql-tag'

export const test = gql`
  query {
    test {
      api 
    }
  }
`

*/


@ObjectType()
class GetTestApiResult {
  constructor(apiVersion: string) {
    this.api = `test ${apiVersion}`
  }

  @Field(() => String)
  api: string
}

@Resolver()
export class  TestResolver {
  @Query(() => GetTestApiResult)
  async test(): Promise<GetTestApiResult> {
    logger.info(`test api 1_0`)
    return new GetTestApiResult("1_0")
  }
}

