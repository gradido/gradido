import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class UnsecureLoginArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  password: string
}

@ArgsType()
export class CreateUserArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  password: string

  @Field(() => String)
  language: string
}

@ArgsType()
export class ChangePasswordArgs {
  @Field(() => Number)
  sessionId: number

  @Field(() => String)
  email: string

  @Field(() => String)
  password: string
}

@ArgsType()
export class UpdateUserInfosArgs {
  @Field(() => Number)
  sessionId!: number

  @Field(() => String)
  email!: string

  @Field({ nullable: true })
  firstName?: string

  @Field({ nullable: true })
  lastName?: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  username?: string

  @Field({ nullable: true })
  language?: string

  @Field({ nullable: true })
  password?: string

  @Field({ nullable: true })
  passwordNew?: string
}

@ArgsType()
export class CheckUsernameArgs {
  @Field(() => String)
  username: string

  @Field(() => Number, { nullable: true })
  groupId?: number
}
