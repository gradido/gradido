import { Community as DbCommunity } from 'database'

import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class GetPublicCommunityInfoResult {
  constructor(dbCom: DbCommunity) {
    this.publicKey = dbCom.publicKey.toString('hex')
    this.name = dbCom.name
    this.description = dbCom.description
    this.creationDate = dbCom.creationDate
  }

  @Field(() => String)
  name: string | null

  @Field(() => String)
  description: string | null

  @Field(() => Date)
  creationDate: Date | null

  @Field(() => String)
  publicKey: string
}
