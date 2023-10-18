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

  @Field(() => String, { nullable: true })
  name: string | null

  @Field(() => String, { nullable: true })
  description: string | null

  @Field(() => Date, { nullable: true })
  creationDate: Date | null

  @Field(() => String)
  publicKey: string
}
