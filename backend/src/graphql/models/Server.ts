import { Entity, BaseEntity } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class Server extends BaseEntity {
  constructor(json: any) {
    super()
    this.loginServerPath = json.login_server_path
  }

  @Field(() => String)
  loginServerPath: string
}
