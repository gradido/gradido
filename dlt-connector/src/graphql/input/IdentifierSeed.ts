// https://www.npmjs.com/package/@apollo/protobufjs

import { IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class IdentifierSeed {
  @Field(() => String)
  @IsString()
  seed: string

  constructor(seed: string) {
    this.seed = seed
  }
}
