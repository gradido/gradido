import protobuf from '@apollo/protobufjs'
import { from_hex } from 'libsodium-wrappers'
import { isHexPublicKey, hasUserAmount } from '../../util/validate'
import { User as dbUser } from '../../typeorm/entity/User'

/**
 *
 * @param senderPublicKey as hex string
 * @param recipiantPublicKey as hex string
 * @param amount as float
 * @param memo
 * @param groupId
 */
export default async function sendCoins(
  senderUser: dbUser,
  recipiantPublicKey: string,
  amount: number,
  memo: string,
  groupId = 0,
) {
  if (senderUser.pubkey.length != 32) {
    throw new Error('invalid sender public key')
  }
  if (!isHexPublicKey(recipiantPublicKey)) {
    throw new Error('invalid recipiant public key')
  }
  if (amount <= 0) {
    throw new Error('invalid amount')
  }
  if (!hasUserAmount(senderUser, amount)) {
    throw new Error("user hasn't enough GDD")
  }
  const protoRoot = await protobuf.load('../../proto/gradido/GradidoTransfer.proto')

  const GradidoTransfer = protoRoot.lookupType('proto.gradido.GradidoTransfer')
  const TransferAmount = protoRoot.lookupType('proto.gradido.TransferAmount')

  const transferAmount = TransferAmount.create({
    pubkey: senderUser.pubkey,
    amount: amount / 10000,
  })

  // no group id is given so we assume it is a local transfer
  if (!groupId) {
    const LocalTransfer = protoRoot.lookupType('proto.gradido.LocalTransfer')
    const localTransfer = LocalTransfer.create({
      sender: transferAmount,
      recipiant: from_hex(recipiantPublicKey),
    })
    return GradidoTransfer.create({ local: localTransfer })
  }
}
