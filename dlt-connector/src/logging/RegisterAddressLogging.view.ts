import { getAddressTypeEnumValue } from '@/data/proto/3_3/enum/AddressType'
import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'

import { AbstractLoggingView } from './AbstractLogging.view'

export class RegisterAddressLoggingView extends AbstractLoggingView {
  public constructor(private self: RegisterAddress) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      userPublicKey: Buffer.from(this.self.userPubkey).toString(this.bufferStringFormat),
      addressType: getAddressTypeEnumValue(this.self.addressType),
      nameHash: Buffer.from(this.self.nameHash).toString(this.bufferStringFormat),
      accountPublicKey: Buffer.from(this.self.accountPubkey).toString(this.bufferStringFormat),
      derivationIndex: this.self.derivationIndex,
    }
  }
}
