import 'reflect-metadata'
import { TransactionType } from '@enum/TransactionType'
import { TransactionInput } from '@input/TransactionInput'
import Decimal from 'decimal.js-light'
import { TransactionBody } from './TransactionBody'
import { TimestampSeconds } from './TimestampSeconds'

describe('proto/TransactionBodyTest', () => {
  it('test compatible with graphql/input/TransactionInput', async () => {
    // test data
    const type = TransactionType.SEND
    const amount = new Decimal('10')
    const createdAt = new TimestampSeconds()
    createdAt.seconds = 1688992436

    // init both objects
    // graphql input object
    const transactionInput = new TransactionInput()
    transactionInput.type = type
    transactionInput.amount = amount
    transactionInput.createdAt = createdAt.seconds

    // protobuf object
    const transactionBody = new TransactionBody()
    // transactionBody.type = type
    // transactionBody.amount = amount.toString()
    transactionBody.createdAt = createdAt

    // create protobuf object from graphql Input object
    const message = TransactionBody.fromObject(transactionInput)
    // serialize both protobuf objects
    const messageBuffer = TransactionBody.encode(message).finish()
    const messageBuffer2 = TransactionBody.encode(transactionBody).finish()

    // compare
    expect(messageBuffer).toStrictEqual(messageBuffer2)
  })
})
