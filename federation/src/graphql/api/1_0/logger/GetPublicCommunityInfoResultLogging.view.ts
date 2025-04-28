import { GetPublicCommunityInfoResult } from '@/graphql/api/1_0/model/GetPublicCommunityInfoResult'
import { AbstractLoggingView } from 'database'

export class GetPublicCommunityInfoResultLoggingView extends AbstractLoggingView {
  public constructor(private self: GetPublicCommunityInfoResult) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      name: this.self.name,
      description: this.self.description,
      creationDate: this.dateToString(this.self.creationDate),
      publicKey: this.self.publicKey,
    }
  }
}
