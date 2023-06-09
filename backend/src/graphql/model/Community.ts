import { Community as DbCommunity } from '@entity/Community'
import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class Community {
  constructor(dbCom: DbCommunity) {
    this.id = dbCom.id
    this.foreign = dbCom.foreign
    this.name = dbCom.name
    this.description = dbCom.description
    this.url = dbCom.url
    this.creationDate = dbCom.creationDate
    this.uuid = dbCom.communityUuid
    this.authenticatedAt = dbCom.authenticatedAt
  }

  @Field(() => Int)
  id: number

  @Field(() => Boolean)
  foreign: boolean

  @Field(() => String, { nullable: true })
  name: string | null

  @Field(() => String, { nullable: true })
  description: string | null

  @Field(() => String)
  url: string

  @Field(() => Date, { nullable: true })
  creationDate: Date | null

  @Field(() => String, { nullable: true })
  uuid: string | null

  @Field(() => Date, { nullable: true })
  authenticatedAt: Date | null
}
