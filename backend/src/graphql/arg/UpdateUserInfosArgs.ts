import { IsBoolean, IsEnum, IsInt, IsString } from 'class-validator'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

import { GmsPublishLocationType } from '@enum/GmsPublishLocationType'
import { GmsPublishNameType } from '@enum/GmsPublishNameType'
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

  @Field({ nullable: true })
  @IsBoolean()
  humhubAllowed?: boolean

  @Field({ nullable: true })
  @IsBoolean()
  gmsAllowed?: boolean

  @Field(() => GmsPublishNameType, { nullable: true })
  @IsEnum(GmsPublishNameType)
  gmsPublishName?: GmsPublishNameType | null

  @Field(() => GmsPublishNameType, { nullable: true })
  @IsEnum(GmsPublishNameType)
  humhubPublishName?: GmsPublishNameType | null

  @Field(() => Location, { nullable: true })
  @isValidLocation()
  gmsLocation?: Location | null

  @Field(() => GmsPublishLocationType, { nullable: true })
  @IsEnum(GmsPublishLocationType)
  gmsPublishLocation?: GmsPublishLocationType | null
}
