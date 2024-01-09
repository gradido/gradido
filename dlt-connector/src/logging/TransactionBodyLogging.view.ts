import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { getEnumValue } from '@/utils/typeConverter'

import { AbstractLoggingView } from './AbstractLogging.view'
import { CommunityRootLoggingView } from './CommunityRootLogging.view'
import { GradidoCreationLoggingView } from './GradidoCreationLogging.view'
import { GradidoDeferredTransferLoggingView } from './GradidoDeferredTransferLogging.view'
import { GradidoTransferLoggingView } from './GradidoTransferLogging.view'
import { GroupFriendsUpdateLoggingView } from './GroupFriendsUpdateLogging.view'
import { RegisterAddressLoggingView } from './RegisterAddressLogging.view'

export class TransactionBodyLoggingView extends AbstractLoggingView {
  public constructor(private self: TransactionBody) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      memo: this.self.memo,
      createdAt: this.timestampToDateString(this.self.createdAt),
      versionNumber: this.self.versionNumber,
      type: getEnumValue(CrossGroupType, this.self.type),
      otherGroup: this.self.otherGroup,
      transfer: this.self.transfer
        ? new GradidoTransferLoggingView(this.self.transfer).toJSON()
        : undefined,
      creation: this.self.creation
        ? new GradidoCreationLoggingView(this.self.creation).toJSON()
        : undefined,
      groupFriendsUpdate: this.self.groupFriendsUpdate
        ? new GroupFriendsUpdateLoggingView(this.self.groupFriendsUpdate).toJSON()
        : undefined,
      registerAddress: this.self.registerAddress
        ? new RegisterAddressLoggingView(this.self.registerAddress).toJSON()
        : undefined,
      deferredTransfer: this.self.deferredTransfer
        ? new GradidoDeferredTransferLoggingView(this.self.deferredTransfer).toJSON()
        : undefined,
      communityRoot: this.self.communityRoot
        ? new CommunityRootLoggingView(this.self.communityRoot).toJSON()
        : undefined,
    }
  }
}
