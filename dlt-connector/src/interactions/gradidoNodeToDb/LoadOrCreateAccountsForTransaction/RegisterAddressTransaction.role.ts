import { Transaction } from '@entity/Transaction'

import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'

export class RegisterAddressTransactionRole extends AbstractTransactionRole {
  public constructor(transaction: Transaction, private registerAddress: RegisterAddress) {
    super(transaction)
  }

  public getAccountPublicKeys(): Buffer[] {
    this.registerAddress.addressType == AddressType.
  }
}
