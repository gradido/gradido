import { Field, Message } from '@apollo/protobufjs'
import { Community } from '@entity/Community'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class CommunityRoot extends Message<CommunityRoot> {
  public constructor(community: Community) {
    super({
      rootPubkey: community.rootPubkey,
      gmwPubkey: community.gmwAccount?.derive2Pubkey,
      aufPubkey: community.aufAccount?.derive2Pubkey,
    })
  }

  @Field.d(1, 'bytes')
  public rootPubkey: Buffer

  // community public budget account
  @Field.d(2, 'bytes')
  public gmwPubkey: Buffer

  // community compensation and environment founds account
  @Field.d(3, 'bytes')
  public aufPubkey: Buffer
}
