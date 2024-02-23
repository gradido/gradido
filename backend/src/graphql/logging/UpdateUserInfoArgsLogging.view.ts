import { AbstractLoggingView } from '@logging/AbstractLogging.view'

import { UpdateUserInfosArgs } from '@arg/UpdateUserInfosArgs'
import { GmsPublishLocationType } from '@enum/GmsPublishLocationType'
import { GmsPublishNameType } from '@enum/GmsPublishNameType'

import { LocationLoggingView } from './LocationLogging.view'

export class UpdateUserInfoArgsLoggingView extends AbstractLoggingView {
  public constructor(private self: UpdateUserInfosArgs) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    let passwords: string | undefined
    if (this.self.password && this.self.password === this.self.passwordNew) {
      passwords = 'identical passwords'
    } else if (this.self.password || this.self.passwordNew) {
      passwords = 'non identical passwords'
    }
    return {
      firstName: this.self.firstName ? this.self.firstName.substring(0, 3) + '...' : undefined,
      lastName: this.self.lastName ? this.self.lastName.substring(0, 3) + '...' : undefined,
      alias: this.self.alias ? this.self.alias.substring(0, 3) + '...' : undefined,
      language: this.self.language,
      passwords,
      publisherId: this.self.publisherId,
      hideAmountGDD: this.self.hideAmountGDD,
      hideAmountGDT: this.self.hideAmountGDT,
      gmsAllowed: this.self.gmsAllowed,
      gmsPublisherName: this.self.gmsPublishName
        ? GmsPublishNameType[this.self.gmsPublishName]
        : this.self.gmsPublishName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      gmsLocation: this.self.gmsLocation
        ? new LocationLoggingView(this.self.gmsLocation).toJSON()
        : this.self.gmsLocation,
      gmsPublishLocation: this.self.gmsPublishLocation
        ? GmsPublishLocationType[this.self.gmsPublishLocation]
        : this.self.gmsPublishLocation,
    }
  }
}
