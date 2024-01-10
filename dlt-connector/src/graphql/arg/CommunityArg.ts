// https://www.npmjs.com/package/@apollo/protobufjs

import { IsBoolean, IsUUID } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class CommunityArg {
  @Field(() => String, { nullable: true })
  @IsUUID('4')
  uuid?: string

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  foreign?: boolean

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  confirmed?: boolean
}
