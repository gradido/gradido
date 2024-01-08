import { IsBoolean, IsInt, IsObject, IsString } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

import { Location } from '@model/Location'

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

  @Field({ nullable: false })
  @IsBoolean()
  gmsAllowed: boolean

  @Field(() => Int, { nullable: false })
  @IsInt()
  gmsPublishName: number

  @Field(() => Location, { nullable: true })
  @IsObject()
  gmsLocation?: Location | null

  @Field(() => Int, { nullable: false })
  @IsInt()
  gmsPublishLocation: number
}
