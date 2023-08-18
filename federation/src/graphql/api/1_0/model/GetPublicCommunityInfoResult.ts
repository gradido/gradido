// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Community as DbCommunity } from '@entity/Community'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class GetPublicCommunityInfoResult {
  constructor(dbCom: DbCommunity) {
    this.publicKey = dbCom.publicKey.toString()
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
