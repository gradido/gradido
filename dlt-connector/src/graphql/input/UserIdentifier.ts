// https://www.npmjs.com/package/@apollo/protobufjs

import { IsObject, IsUUID, ValidateNested } from 'class-validator'
import { Field, InputType } from 'type-graphql'

import { CommunityUser } from './CommunityUser'
import { IdentifierSeed } from './IdentifierSeed'

@InputType()
export class UserIdentifier {
  @Field(() => String)
  @IsUUID('4')
  communityUuid: string

  @Field(() => CommunityUser, { nullable: true })
  @IsObject()
  @ValidateNested()
  communityUser?: CommunityUser

  @Field(() => IdentifierSeed, { nullable: true })
  @IsObject()
  @ValidateNested()
  seed?: IdentifierSeed
}
