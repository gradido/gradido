import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'
import { Server } from './Server'
import { User } from './User'

@Entity()
@ObjectType()
export class UserInfoData extends BaseEntity {
  constructor(json: any) {
    super()
    this.state = json.state
    this.userData = new User(json.user_data)
    this.server = new Server(json.server)
    this.errors = json.errors
  }

  @Field(() => String)
  state: string

  @Field(() => User)
  userData: User

  @Field(() => Server)
  server: Server

  @Field(() => [String])
  errors: [string]
}

@Entity()
@ObjectType()
export class GetUserInfoResponse extends BaseEntity {
  @Field(() => Boolean)
  success: boolean

  @Field(() => UserInfoData)
  data: UserInfoData
}
