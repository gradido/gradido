import { AbstractLoggingView } from 'database'

import { Profile } from '@/apis/humhub/model/Profile'

export class ProfileLoggingView extends AbstractLoggingView {
  public constructor(private self: Profile) {
    super()
  }

  public toJSON(): Profile {
    const gradidoAddressParts = this.self.gradido_address.split('/')
    return {
      firstname: this.self.firstname.substring(0, 3) + '...',
      lastname: this.self.lastname.substring(0, 3) + '...',
      // eslint-disable-next-line camelcase
      gradido_address:
        gradidoAddressParts[0] + '/' + gradidoAddressParts[1].substring(0, 3) + '...',
    }
  }
}
