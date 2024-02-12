import { IsBoolean, IsInt, IsString } from 'class-validator'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

import { Location } from '@model/Location'

import { isValidLocation } from '@/graphql/validator/Location'

@InputType()
@ArgsType()
export class UpdateUserInfosArgs {
  @Field({ nullable: true })
  @IsString()
  firstName?: string

  @Field({ nullable: true })
  @IsString()
  lastName?: string

  @Field({ nullable: true })
  @IsString()
  alias?: string

  @Field({ nullable: true })
  @IsString()
  language?: string

  @Field(() => Int, { nullable: true })
  @IsInt()
  publisherId?: number | null

  @Field({ nullable: true })
  @IsString()
  password?: string

  @Field({ nullable: true })
  @IsString()
  passwordNew?: string

  @Field({ nullable: true })
  @IsBoolean()
  hideAmountGDD?: boolean

  @Field({ nullable: true })
  @IsBoolean()
  hideAmountGDT?: boolean

  @Field({ nullable: true, defaultValue: true })
  @IsBoolean()
  gmsAllowed?: boolean

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt()
  gmsPublishName?: number | null

  @Field(() => Location, { nullable: true })
  @isValidLocation()
  gmsLocation?: Location | null

  @Field(() => Int, { nullable: true, defaultValue: 2 })
  @IsInt()
  gmsPublishLocation?: number | null
}
