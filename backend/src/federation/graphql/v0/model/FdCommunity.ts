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
      if (dbFed.publicKey) {
        this.publicKey = dbFed.publicKey.toString('hex')
      }
      this.authenticatedAt = dbFed.authenticatedAt
      if (dbFed.dhtPublicKey) {
        this.dhtPublicKey = dbFed.dhtPublicKey.toString('hex')
      }
      this.dhtVerifiedAt = dbFed.dhtPubKeyVerifiedAt
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
  authenticatedAt: Date

  @Field(() => String)
  publicKey: string

  @Field(() => String, { nullable: true })
  privKey: string

  @Field(() => String)
  dhtPublicKey: string

  @Field(() => String, { nullable: true })
  dhtSecretKey: string

  @Field(() => Date, { nullable: true })
  dhtVerifiedAt: Date | null

  @Field(() => String)
  apiVersion: string

  @Field(() => Date)
  validFrom: Date
}
