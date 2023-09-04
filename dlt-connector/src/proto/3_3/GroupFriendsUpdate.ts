import { Field, Message } from '@apollo/protobufjs'

// connect group together
// only CrossGroupType CROSS (in TransactionBody)
// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GroupFriendsUpdate extends Message<GroupFriendsUpdate> {
  // if set to true, colors of this both groups are trait as the same
  // on creation user get coins still in there color
  // on transfer into another group which a connection exist,
  // coins will be automatic swapped into user group color coin
  // (if fusion between src coin and dst coin is enabled)
  @Field.d(1, 'bool')
  public colorFusion: boolean
}
