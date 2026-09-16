import { Community as DbCommunity } from 'database'

import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class GetPublicCommunityInfoResult {
  constructor(dbCom: DbCommunity) {
    this.publicKey = dbCom.publicKey.toString('hex')
    this.publicJwtKey = dbCom.publicJwtKey
    this.name = dbCom.name
    this.description = dbCom.description
    this.creationDate = dbCom.creationDate
    this.hieroTopicId = dbCom.hieroTopicId
  }

  @Field(() => String, { nullable: true })
  name: string | null

  @Field(() => String, { nullable: true })
  description: string | null

  @Field(() => Date, { nullable: true })
  creationDate: Date | null

  @Field(() => String)
  publicKey: string

  @Field(() => String, { nullable: true })
  publicJwtKey: string | null

  @Field(() => String, { nullable: true })
  hieroTopicId: string | null
}
