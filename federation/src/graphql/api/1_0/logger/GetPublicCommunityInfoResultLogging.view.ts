import { GetPublicCommunityInfoResult } from '@/graphql/api/1_0/model/GetPublicCommunityInfoResult'
import { AbstractLoggingView } from '@logging/AbstractLogging.view'

export class GetPublicCommunityInfoResultLoggingView extends AbstractLoggingView {
  public constructor(private self: GetPublicCommunityInfoResult) {
    super()
  }

  public toJSON(): any {
    return {
      name: this.self.name,
      description: this.self.description,
      creationDate: this.dateToString(this.self.creationDate),
      publicKey: this.self.publicKey,
    }
  }
}
