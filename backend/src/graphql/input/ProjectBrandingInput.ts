import { IsString, IsOptional, MaxLength, IsNumber, IsBoolean, IsUrl } from 'class-validator'
import { InputType, Field, Int } from 'type-graphql'

@InputType()
export class ProjectBrandingInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  id: number | null | undefined

  @Field(() => String)
  @IsString()
  name: string

  @Field(() => String)
  @IsString()
  @MaxLength(32)
  alias: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description: string | null | undefined

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @IsOptional()
  spaceId: number | null | undefined

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl()
  spaceUrl: string | null | undefined

  @Field(() => Boolean)
  @IsBoolean()
  newUserToSpace: boolean

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl()
  logoUrl: string | null | undefined
}
