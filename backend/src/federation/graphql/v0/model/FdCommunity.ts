/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CommunityFederation as DbFederation } from '@entity/CommunityFederation'
import { CommunityApiVersion as DbApiVersion } from '@entity/CommunityApiVersion'
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class FdCommunity {
  constructor(
    name: string,
    url: string,
    descript: string,
    dbFed?: DbFederation,
    dbApi?: DbApiVersion,
  ) {
    this.name = name
    this.url = url
    this.description = descript
    if (dbFed) {
      this.publicKey = dbFed.pubKey.toString('hex')
      this.verifiedAt = dbFed.pubKeyVerifiedAt
      this.authenticatedAt = dbFed.authenticatedAt
    }
    if (dbApi) {
      this.apiVersion = dbApi.apiVersion
      this.url = dbApi.url
      this.validFrom = dbApi.validFrom
    }
  }

  @Field(() => Number, { nullable: true })
  id: number

  @Field(() => String, { nullable: true })
  uuid: string

  @Field(() => String, { nullable: true })
  name: string

  @Field(() => String)
  url: string

  @Field(() => String, { nullable: true })
  description: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  verifiedAt: Date | null

  @Field(() => Date, { nullable: true })
  authenticatedAt: Date

  @Field(() => String)
  publicKey: string

  @Field(() => String, { nullable: true })
  privKey: string

  @Field(() => String)
  apiVersion: string

  @Field(() => Date)
  validFrom: Date
}
