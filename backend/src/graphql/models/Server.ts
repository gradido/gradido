/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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
