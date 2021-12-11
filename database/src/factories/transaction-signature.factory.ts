import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { TransactionSignature } from '../../entity/TransactionSignature'
import { TransactionSignatureContext } from '../interface/TransactionContext'
import { randomBytes } from 'crypto'

define(TransactionSignature, (faker: typeof Faker, context?: TransactionSignatureContext) => {
  if (!context || !context.transaction) {
    throw new Error('TransactionSignature: No transaction present!')
  }

  const transactionSignature = new TransactionSignature()
  transactionSignature.signature = context.signature ? context.signature : randomBytes(64)
  transactionSignature.pubkey = context.pubkey ? context.pubkey : randomBytes(32)
  transactionSignature.transaction = context.transaction

  return transactionSignature
})
