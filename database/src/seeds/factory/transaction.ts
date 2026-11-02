import { Decay, GradidoUnit } from 'shared'
import { drizzleDb } from '../../AppDatabase'
import { User } from '../../entity'
import { TransactionTypeId } from '../../enum'
import {
  dbInsertTransactions,
  dbSelectLastTransaction,
  dbUpdateLinkedTransactionId,
} from '../../queries/transactions'
import { TransactionInsert } from '../../schemas/drizzle.schema'
import { SeedUserRef, seedUserRefOf } from './user'

/**
 * A transfer between two members of this community: a SEND row with the amount negative and a
 * RECEIVE row with it positive, as the server books them, that name each other. Each is built on
 * the last booking of its member.
 *
 * ⚠️ Seed a member's bookings in CHRONOLOGICAL order, see foreignReceive. And the sender needs the
 * amount on that date, after decay: a seed that spends what nobody has throws here, not at some
 * later booking of theirs, where decay refuses the negative balance without saying why.
 */
export async function transferGradidos(
  sendUser: User,
  recipientUser: User,
  amount: GradidoUnit,
  memo: string,
  balanceDate: Date,
): Promise<[SeedTransfer, SeedTransfer]> {
  return drizzleDb().transaction(async (tx) => {
    const sender = seedUserRefOf(sendUser)
    const recipient = seedUserRefOf(recipientUser)
    const send = bookingRow(
      amount.negated(),
      memo,
      sender,
      recipient,
      TransactionTypeId.SEND,
      balanceDate,
      await dbSelectLastTransaction(sendUser.id, tx),
    )
    if ((send.balance as GradidoUnit).isNegative()) {
      throw new Error(
        `${sender.name} cannot send ${amount.toString(2)} GDD on ${balanceDate.toISOString()}: ` +
          `the balance would be ${(send.balance as GradidoUnit).toString(2)}`,
      )
    }
    const receive = bookingRow(
      amount,
      memo,
      recipient,
      sender,
      TransactionTypeId.RECEIVE,
      balanceDate,
      await dbSelectLastTransaction(recipientUser.id, tx),
    )
    const [sendId, receiveId] = await dbInsertTransactions([send, receive], tx)
    await dbUpdateLinkedTransactionId(sendId, receiveId, tx)
    await dbUpdateLinkedTransactionId(receiveId, sendId, tx)
    return [
      { ...send, id: sendId, linkedTransactionId: receiveId },
      { ...receive, id: receiveId, linkedTransactionId: sendId },
    ]
  })
}

/** A row of a transfer as transferGradidos writes it, with both ids known. */
export type SeedTransfer = TransactionInsert & { id: number; linkedTransactionId: number }

/** What a booking builds on: the last one of its member. */
export interface LastBooking {
  id: number
  balance: GradidoUnit | null
  balanceDate: Date
}

/** One `transactions` row, built on the member's last booking. */
export function bookingRow(
  amount: GradidoUnit,
  memo: string,
  user: SeedUserRef,
  // the counterparty as the row names them: a member of another community has no id here, and
  // not always a name
  linkedUser: Omit<SeedUserRef, 'id' | 'name'> & { id: number | null; name: string | null },
  type: TransactionTypeId,
  balanceDate: Date,
  lastBooking: LastBooking | null,
  creationDate?: Date | null,
): TransactionInsert {
  let newBalance = new GradidoUnit(0n)
  let decay: Decay | null = null
  if (lastBooking) {
    // the column is nullable, a booking of these factories always has a balance
    decay = lastBooking.balance!.calculateDecay(lastBooking.balanceDate, balanceDate)
    newBalance = decay.balance
  }
  const row: TransactionInsert = {
    typeId: type,
    memo,
    userId: user.id,
    userGradidoId: user.gradidoId,
    userName: user.name,
    userCommunityUuid: user.communityUuid,
    linkedUserId: linkedUser.id,
    linkedUserGradidoId: linkedUser.gradidoId,
    linkedUserName: linkedUser.name,
    linkedUserCommunityUuid: linkedUser.communityUuid,
    previous: lastBooking ? lastBooking.id : null,
    amount,
    balance: newBalance.add(amount),
    balanceDate,
    decay: decay ? decay.decay : new GradidoUnit(0n),
    decayStart: decay ? decay.start : null,
  }
  if (creationDate) {
    row.creationDate = creationDate
  }
  return row
}

/**
 * A booking with a member of ANOTHER community, the way the federation writes it: no local
 * user id, the uuid pair and the name as it arrived on the row.
 *
 * `transferGradidos` cannot do this -- it takes two local `User` entities and copies the
 * counterparty's id from the second.
 *
 * ⚠️ Seed a member's bookings in CHRONOLOGICAL order, as with every factory here: the
 * balance comes from their last booking and the decay is computed between the two dates,
 * and decay does not run backwards -- an earlier date than the previous one throws.
 *
 * @param name what the sending community called them; a pre-alias-era "First Last" is a
 *   legitimate value here, and the point of several tests
 * @param linkedUserId the `users` row the federation stored for them, where there is one.
 *   Left out it is null, which is the older shape and what every caller before 04.09.2026
 *   wanted. Both shapes exist side by side for one person once such a row is stored --
 *   `settlePendingReceiveTransaction` copies the id onto the booking from then on -- and
 *   that is the case `mergeSamePerson` in queries/transactions.ts joins back together.
 */
export async function foreignReceive(
  user: User,
  counterparty: {
    communityUuid: string
    gradidoID: string
    name: string | null
    linkedUserId?: number | null
  },
  balanceDate: Date,
  amount: GradidoUnit = new GradidoUnit(10000n),
): Promise<TransactionInsert & { id: number }> {
  return drizzleDb().transaction(async (tx) => {
    const row = bookingRow(
      amount,
      'from afar',
      seedUserRefOf(user),
      {
        id: counterparty.linkedUserId ?? null,
        gradidoId: counterparty.gradidoID,
        communityUuid: counterparty.communityUuid,
        name: counterparty.name,
      },
      TransactionTypeId.RECEIVE,
      balanceDate,
      await dbSelectLastTransaction(user.id, tx),
    )
    const [id] = await dbInsertTransactions([row], tx)
    return { ...row, id }
  })
}

export async function createTransaction(
  amount: GradidoUnit,
  memo: string,
  user: User,
  linkedUser: User,
  type: TransactionTypeId,
  balanceDate: Date,
  creationDate?: Date,
): Promise<TransactionInsert & { id: number }> {
  const row = bookingRow(
    amount,
    memo,
    seedUserRefOf(user),
    seedUserRefOf(linkedUser),
    type,
    balanceDate,
    await dbSelectLastTransaction(user.id),
    creationDate,
  )
  const [id] = await dbInsertTransactions([row])
  return { ...row, id }
}
