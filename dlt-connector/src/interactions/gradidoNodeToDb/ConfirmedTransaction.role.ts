import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { LogError } from '@/server/LogError'
import { timestampSecondsToDate } from '@/utils/typeConverter'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

export class ConfirmedTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(private self: Transaction) {}

  public async fillFromConfirmedTransaction(confirmedTransactionProto: ConfirmedTransaction) : Promise<void> {
    
    this.self.nr = confirmedTransactionProto.id.toInt()
    if(new Long(this.self.nr) !== confirmedTransactionProto.id) {
      throw new LogError('datatype overflow, please update transactions.nr data type')
    }
    this.self.runningHash = Buffer.from(confirmedTransactionProto.runningHash)
    this.self.accountBalanceConfirmedAt = new Decimal(confirmedTransactionProto.accountBalance)
    this.self.confirmedAt = timestampSecondsToDate(confirmedTransactionProto.confirmedAt)
  }
}
