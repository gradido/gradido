import { GmsPublishLocationType } from '@enum/GmsPublishLocationType'
import { PublishNameType } from '@enum/PublishNameType'
import { Location } from '@model/Location'
import { IsBoolean, IsEnum, IsInt, IsString } from 'class-validator'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

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

  @Field(() => PublishNameType, { nullable: true })
  @IsEnum(PublishNameType)
  gmsPublishName?: PublishNameType | null

  @Field(() => PublishNameType, { nullable: true })
  @IsEnum(PublishNameType)
  humhubPublishName?: PublishNameType | null

  @Field(() => Location, { nullable: true })
  @isValidLocation()
  gmsLocation?: Location | null

  @Field(() => GmsPublishLocationType, { nullable: true })
  @IsEnum(GmsPublishLocationType)
  gmsPublishLocation?: GmsPublishLocationType | null
}
