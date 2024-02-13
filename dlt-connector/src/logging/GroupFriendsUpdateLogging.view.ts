import { GroupFriendsUpdate } from '@/data/proto/3_3/GroupFriendsUpdate'

import { AbstractLoggingView } from './AbstractLogging.view'

export class GroupFriendsUpdateLoggingView extends AbstractLoggingView {
  public constructor(private self: GroupFriendsUpdate) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      colorFusion: this.self.colorFusion,
    }
  }
}
