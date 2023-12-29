import { BackendTransaction } from '@entity/BackendTransaction'
import { Transaction } from '@entity/Transaction'
import { IsInt, IsString } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'

import { TransactionLogic } from '@/data/Transaction.logic'
import { isValidDateString } from '@/graphql/validator/DateString'
import { IsPositiveDecimal } from '@/graphql/validator/Decimal'
import { LogError } from '@/server/LogError'

import { InputTransactionType } from '../enum/InputTransactionType'

@ObjectType()
export class ConfirmBackendTransaction {
  public constructor(confirmedTransaction: Transaction, backendTransaction: BackendTransaction) {
    // force parse to int, typeorm return id as string even it is typed as numeric
    this.transactionId = backendTransaction.backendTransactionId
    if (typeof backendTransaction.backendTransactionId === 'string') {
      this.transactionId = parseInt(backendTransaction.backendTransactionId)
    }
    if (
      (!this.transactionId || this.transactionId <= 0) &&
      (!confirmedTransaction.iotaMessageId || confirmedTransaction.iotaMessageId.length !== 32)
    ) {
      throw new LogError(
        'need at least iota message id or backend transaction id for matching transaction in backend',
      )
    }
    const transactionLogic = new TransactionLogic(confirmedTransaction)
    const balanceAccount = transactionLogic.getBalanceAccount(
      backendTransaction.typeId as InputTransactionType,
    )
    if (!confirmedTransaction.iotaMessageId) {
      throw new LogError('missing iota message id')
    }
    if (!backendTransaction.balance) {
      throw new LogError('missing balance on backendTransaction')
    }
    this.iotaMessageId = Buffer.from(confirmedTransaction.iotaMessageId).toString('hex')
    this.gradidoId = balanceAccount?.user?.gradidoID
    this.balance = backendTransaction.balance
    this.balanceDate = backendTransaction.createdAt.toISOString()
  }

  @Field(() => Int, { nullable: true })
  @IsInt()
  transactionId?: number | null

  @Field(() => String)
  @IsString()
  iotaMessageId: string

  @Field(() => String, { nullable: true })
  @IsString()
  gradidoId?: string | null

  @Field(() => Decimal)
  @IsPositiveDecimal()
  balance: Decimal

  @Field(() => String)
  @isValidDateString()
  balanceDate: string
}
