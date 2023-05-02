// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Community as DbCommunity } from '@entity/Community'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class GetPublicCommunityInfoResult {
  constructor(dbCom: DbCommunity) {
    this.publicKey = dbCom.publicKey.toString('hex')
    this.name = dbCom.name
    this.description = dbCom.description
    this.createdAt = dbCom.creationDate
  }

  @Field(() => String)
  name: string | null

  @Field(() => String)
  description: string | null

  @Field(() => Date)
  createdAt: Date | null

  @Field(() => String)
  publicKey: string
}
