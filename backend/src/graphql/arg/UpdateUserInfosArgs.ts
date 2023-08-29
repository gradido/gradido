import { IsBoolean, IsInt, IsString } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

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
}
